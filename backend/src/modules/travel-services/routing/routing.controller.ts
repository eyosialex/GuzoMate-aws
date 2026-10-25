import { Request, Response } from 'express';
import { routingService } from './routing.service.js';

export class RoutingController {
  public async getRoutes(req: Request, res: Response) {
    try {
      const origin = req.query.origin as string;
      const destination = req.query.destination as string;

      if (!origin || !destination) {
        return res.status(400).json({ error: 'origin and destination are required query parameters.' });
      }

      const routes = await routingService.getRoutes(origin, destination);
      return res.json({ count: routes.length, routes });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export const routingController = new RoutingController();
