import { Request, Response, NextFunction } from 'express';
import { IncidentsService } from './incidents.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export class IncidentsController {
  static async createIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await IncidentsService.createIncident(req.user!.id, req.body);
      sendSuccess(res, incident, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getNearbyIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, meta } = await IncidentsService.getNearbyIncidents(req.query as any);
      sendSuccess(res, { items }, 200, meta);
    } catch (error) {
      next(error);
    }
  }

  static async listIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, meta } = await IncidentsService.listIncidents(req.query as any);
      sendSuccess(res, { items }, 200, meta);
    } catch (error) {
      next(error);
    }
  }

  static async getIncidentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await IncidentsService.getIncidentById(
        req.params.id as string,
        req.user?.id
      );
      sendSuccess(res, incident);
    } catch (error) {
      next(error);
    }
  }

  static async updateIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await IncidentsService.updateIncident(
        req.params.id as string,
        req.user!,
        req.body
      );
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await IncidentsService.deleteIncident(
        req.params.id as string,
        req.user!
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
