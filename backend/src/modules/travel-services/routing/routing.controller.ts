import { Request, Response, NextFunction } from 'express';
import { routingService, RoutingService } from './routing.service.js';
import { routeQuerySchema } from './routing.validation.js';

export class RoutingController {
  constructor(private service: RoutingService = routingService) {}

  public async getRoutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = await routeQuerySchema.parseAsync(req.query);
      const result = await this.service.calculateRoutes(
        { lat: parsed.originLat, lon: parsed.originLon },
        { lat: parsed.destLat, lon: parsed.destLon },
        parsed.mode,
        parsed.language as 'en' | 'am' | 'om',
        parsed.includeIncidents
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

export const routingController = new RoutingController();
