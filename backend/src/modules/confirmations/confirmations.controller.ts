import { Request, Response, NextFunction } from 'express';
import { ConfirmationsService } from './confirmations.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export class ConfirmationsController {
  static async voteOnIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ConfirmationsService.voteOnIncident(
        req.params.id as string,
        req.user!.id,
        req.body
      );
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}
