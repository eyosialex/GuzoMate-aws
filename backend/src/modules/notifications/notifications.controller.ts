import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export class NotificationsController {
  static async registerDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const device = await NotificationsService.registerDeviceToken(req.user!.id, req.body);
      sendSuccess(res, device, 201);
    } catch (error) {
      next(error);
    }
  }

  static async removeDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await NotificationsService.removeDeviceToken(
        req.user!.id,
        req.params.id as string
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, unreadCount, meta } = await NotificationsService.getUserNotifications(
        req.user!.id,
        req.query as any
      );
      sendSuccess(res, { items, unreadCount }, 200, meta);
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await NotificationsService.markAsRead(
        req.user!.id,
        req.params.id as string
      );
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await NotificationsService.markAllAsRead(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
