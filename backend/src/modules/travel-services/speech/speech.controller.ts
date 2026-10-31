import { Request, Response, NextFunction } from 'express';
import { speechService, SpeechService } from './speech.service.js';
import {
  speechTranscriptionSchema,
  speechSynthesisSchema,
} from './speech.validation.js';

export class SpeechController {
  constructor(private service: SpeechService = speechService) {}

  public async transcribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = await speechTranscriptionSchema.parseAsync(req.body);
      const result = await this.service.transcribe(parsed.audio, parsed.language, {
        mimeType: parsed.mimeType,
        format: parsed.format,
      });

      res.status(200).json({
        success: true,
        data: result,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async synthesize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = await speechSynthesisSchema.parseAsync(req.body);
      const result = await this.service.synthesize(
        parsed.text,
        parsed.language,
        parsed.voiceId
      );

      res.status(200).json({
        success: true,
        data: result,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const speechController = new SpeechController();
