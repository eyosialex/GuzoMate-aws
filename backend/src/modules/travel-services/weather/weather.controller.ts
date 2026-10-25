import { Request, Response } from 'express';
import { weatherService } from './weather.service.js';
import { SupportedLanguage } from '../../assistant/dto/assistant-query.dto.js';

export class WeatherController {
  public async getCurrent(req: Request, res: Response) {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const language = (req.query.lang as SupportedLanguage) || 'en';

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Valid lat and lon query parameters are required.' });
      }

      const weather = await weatherService.getCurrentAndForecast({ lat, lon }, undefined, language);
      return res.json({ current: weather.current });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public async getForecast(req: Request, res: Response) {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const language = (req.query.lang as SupportedLanguage) || 'en';

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Valid lat and lon query parameters are required.' });
      }

      const weather = await weatherService.getCurrentAndForecast({ lat, lon }, undefined, language);
      return res.json({ forecast: weather.forecast });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public async getArrivalAdvice(req: Request, res: Response) {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const arrivalTime = req.query.arrivalTime as string;
      const language = (req.query.lang as SupportedLanguage) || 'en';

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Valid lat and lon query parameters are required.' });
      }

      const advice = await weatherService.getArrivalAdvice({ lat, lon }, arrivalTime, language);
      return res.json({ arrivalAdvice: advice });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export const weatherController = new WeatherController();
