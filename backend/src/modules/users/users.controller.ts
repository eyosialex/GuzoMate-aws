import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export class UsersController {
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await UsersService.getProfile(req.user!.id);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await UsersService.updateProfile(req.user!.id, req.body);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async getNotificationPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferences = await UsersService.getNotificationPreferences(req.user!.id);
      sendSuccess(res, preferences);
    } catch (error) {
      next(error);
    }
  }

  static async updateNotificationPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await UsersService.updateNotificationPreferences(req.user!.id, req.body);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { users, meta } = await UsersService.listUsers(req.query as any);
      sendSuccess(res, { items: users }, 200, meta);
    } catch (error) {
      next(error);
    }
  }

  static async adminUpdateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await UsersService.adminUpdateUser(
        req.user!.id,
        req.params.id as string,
        req.body
      );
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }
}
