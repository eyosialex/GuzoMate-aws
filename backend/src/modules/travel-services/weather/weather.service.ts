import { weatherProvider, WeatherProvider } from './weatherapi.provider.js';
import { SupportedLanguage } from '../../assistant/dto/assistant-query.dto.js';
import { WeatherResultItem } from '../../assistant/dto/assistant-response.dto.js';

export class WeatherService {
  constructor(private provider: WeatherProvider = weatherProvider) {}

  public async getCurrentAndForecast(
    location: { lat: number; lon: number },
    arrivalTime?: string,
    language: SupportedLanguage = 'en'
  ): Promise<WeatherResultItem> {
    return this.provider.getForecast(location, arrivalTime, language);
  }

  public async getArrivalAdvice(
    location: { lat: number; lon: number },
    arrivalTime: string,
    language: SupportedLanguage = 'en'
  ) {
    const forecast = await this.provider.getForecast(location, arrivalTime, language);
    return forecast.arrivalAdvice;
  }
}

export const weatherService = new WeatherService();
