import { Request, Response } from 'express';
import { AssistantQuerySchema } from './dto/assistant-query.dto.js';
import { assistantService } from './assistant.service.js';
import { AppError } from './dto/errors.js';

export class AssistantController {
  /**
   * POST /api/v1/assistant/query
   */
  public async handleQuery(req: Request, res: Response): Promise<void> {
    const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}`;
    const rawBody = req.body || {};
    const effectiveUserId = rawBody.userId || (req.headers['x-user-id'] as string) || undefined;
    const queryText = (typeof rawBody.query === 'string' && rawBody.query.trim())
      ? rawBody.query
      : (typeof rawBody.message === 'string' && rawBody.message.trim())
        ? rawBody.message
        : (typeof rawBody.text === 'string' ? rawBody.text : '');

    // 1. Schema validation
    const validationResult = AssistantQuerySchema.safeParse({
      ...rawBody,
      query: queryText,
      userId: effectiveUserId,
    });

    if (!validationResult.success) {
      const details = validationResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'One or more fields are invalid.',
          details,
          requestId,
        },
      });
      return;
    }

    try {
      // 2. Execute assistant workflow
      const response = await assistantService.query(validationResult.data);
      res.status(200).json(response);
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
            requestId,
          },
        });
        return;
      }

      console.error('[AssistantController Error]', err);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected internal error occurred while processing assistant query.',
          requestId,
        },
      });
    }
  }

  /**
   * POST /api/v1/speech/synthesis or /api/v1/assistant/speech/synthesis
   * Addis AI Speech Synthesis endpoint (GuzoMate API Ref Section 8)
   */
  public async handleSpeechSynthesis(req: Request, res: Response): Promise<void> {
    const { text, language = 'en', voice, voiceId } = req.body;
    const targetVoice = voice || voiceId;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'text is required and must be a non-empty string.',
        },
      });
      return;
    }

    const validLangs = ['en', 'am', 'om'];
    if (language && !validLangs.includes(language)) {
      res.status(422).json({
        error: {
          code: 'UNSUPPORTED_LANGUAGE',
          message: `Language '${language}' is not supported for speech synthesis. Supported: en, am, om.`,
        },
      });
      return;
    }

    try {
      const voiceResult = await assistantService.synthesizeSpeech(text, language, targetVoice);
      if (!voiceResult) {
        res.status(502).json({
          error: {
            code: 'SPEECH_SYNTHESIS_FAILED',
            message: 'Addis AI speech service unavailable or unable to synthesize audio.',
          },
        });
        return;
      }

      res.status(200).json(voiceResult);
    } catch (err: any) {
      console.error('[SpeechSynthesis Error]', err);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err?.message || 'Speech synthesis failed.',
        },
      });
    }
  }

  /**
   * POST /api/v1/assistant/memory/clear
   * Clears the persistent conversation memory for a user's single session.
   */
  public async handleClearMemory(req: Request, res: Response): Promise<void> {
    const rawBody = req.body || {};
    const userId = (rawBody.userId as string) || (req.headers['x-user-id'] as string) || 'default_traveler';

    try {
      const deletedCount = await assistantService.clearUserMemory(userId);
      res.status(200).json({
        success: true,
        message: `Persistent session memory cleared for user '${userId}'.`,
        deletedTurns: deletedCount,
      });
    } catch (err: any) {
      console.error('[ClearMemory Error]', err);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err?.message || 'Failed to clear conversation memory.',
        },
      });
    }
  }
}

export const assistantController = new AssistantController();
