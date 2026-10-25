import { Request, Response, NextFunction } from 'express';
import { weatherService, WeatherService } from './weather.service.js';
import {
  currentWeatherQuerySchema,
  forecastWeatherQuerySchema,
  arrivalAdviceQuerySchema,
} from './weather.validation.js';

export class WeatherController {
  constructor(private service: WeatherService = weatherService) {}

  public async getCurrent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = await currentWeatherQuerySchema.parseAsync(req.query);
      const result = await this.service.getCurrentWeather(
        { lat: parsed.lat, lon: parsed.lon },
        parsed.language
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

  public async getForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = await forecastWeatherQuerySchema.parseAsync(req.query);
      const result = await this.service.getForecast(
        { lat: parsed.lat, lon: parsed.lon },
        parsed.days,
        parsed.language
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

  public async getArrivalAdvice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = await arrivalAdviceQuerySchema.parseAsync(req.query);
      const result = await this.service.getArrivalAdvice(
        { lat: parsed.lat, lon: parsed.lon },
        parsed.arrivalTime,
        parsed.etaMinutes,
        parsed.language
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

export const weatherController = new WeatherController();
