import { weatherApiProvider, IWeatherProvider } from './weatherapi.provider.js';
import { weatherCache, WeatherCacheService } from './weather.cache.js';
import {
  CurrentWeatherResponse,
  ForecastWeatherResponse,
  NormalizedWeatherData,
  SupportedLanguage,
  WeatherArrivalAdvice,
  WeatherLocation,
} from './weather.types.js';

export class WeatherService {
  constructor(
    private provider: IWeatherProvider = weatherApiProvider,
    private cache: WeatherCacheService = weatherCache
  ) {}

  public async getNormalizedData(
    location: WeatherLocation,
    days = 3,
    language: SupportedLanguage = 'en'
  ): Promise<{ data: NormalizedWeatherData; cached: boolean }> {
    const cacheKey = this.cache.getCacheKey(location.lat, location.lon, days);
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return { data: cached, cached: true };
    }

    const data = await this.provider.fetchForecast(location, days, language);
    await this.cache.set(cacheKey, location.lat, location.lon, data);

    return { data, cached: false };
  }

  public async getCurrentWeather(
    location: WeatherLocation,
    language: SupportedLanguage = 'en'
  ): Promise<CurrentWeatherResponse> {
    const { data, cached } = await this.getNormalizedData(location, 1, language);
    return {
      location: data.location,
      current: data.current,
      provider: data.provider,
      retrievedAt: data.retrievedAt,
      cached,
    };
  }

  public async getForecast(
    location: WeatherLocation,
    days = 3,
    language: SupportedLanguage = 'en'
  ): Promise<ForecastWeatherResponse> {
    const { data, cached } = await this.getNormalizedData(location, days, language);
    return {
      location: data.location,
      forecast: data.forecast,
      provider: data.provider,
      retrievedAt: data.retrievedAt,
      cached,
    };
  }

  public async getArrivalAdvice(
    location: WeatherLocation,
    arrivalTime?: string,
    etaMinutes?: number,
    language: SupportedLanguage = 'en'
  ): Promise<WeatherArrivalAdvice> {
    // 1. Resolve target arrival ISO timestamp
    let targetIso: string;
    if (arrivalTime) {
      targetIso = new Date(arrivalTime).toISOString();
    } else if (etaMinutes !== undefined) {
      targetIso = new Date(Date.now() + etaMinutes * 60 * 1000).toISOString();
    } else {
      // Default fallback: 90 minutes from now
      targetIso = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    }

    // 2. Fetch forecast data (3 days gives plenty of arrival horizon)
    const { data, cached } = await this.getNormalizedData(location, 3, language);

    // 3. Generate actionable advice
    const advice = this.provider.generateArrivalAdvice(data, targetIso, language);
    advice.cached = cached;
    return advice;
  }

  /**
   * Compatibility method for Member 2's AI assistant RAG pipeline.
   */
  public async getCurrentAndForecast(
    location: WeatherLocation,
    arrivalTime?: string,
    language: SupportedLanguage = 'en'
  ): Promise<{
    location: WeatherLocation;
    current: any;
    forecast: any;
    arrivalAdvice?: any;
    provider: string;
    retrievedAt: string;
    cached: boolean;
  }> {
    const { data, cached } = await this.getNormalizedData(location, 3, language);
    const arrivalAdvice = arrivalTime
      ? this.provider.generateArrivalAdvice(data, arrivalTime, language)
      : undefined;

    return {
      location: data.location,
      current: data.current,
      forecast: data.forecast,
      arrivalAdvice,
      provider: data.provider,
      retrievedAt: data.retrievedAt,
      cached,
    };
  }
}

export const weatherService = new WeatherService();
