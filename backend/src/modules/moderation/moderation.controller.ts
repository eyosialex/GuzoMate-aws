import { Request, Response, NextFunction } from 'express';
import { ModerationService } from './moderation.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export class ModerationController {
  static async listIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, meta } = await ModerationService.listIncidentsForReview(req.query as any);
      sendSuccess(res, { items }, 200, meta);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ModerationService.updateIncidentStatus(
        req.user!.id,
        req.params.id as string,
        req.body
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ModerationService.getIncidentHistory(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
