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

    // 1. Schema validation
    const validationResult = AssistantQuerySchema.safeParse(req.body);

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
}

export const assistantController = new AssistantController();
