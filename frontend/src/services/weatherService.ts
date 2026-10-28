import { request } from '../lib/apiClient';
import { Language, WeatherData } from '../types';
import {
  CurrentWeather,
  DailyForecast,
  ArrivalAdviceData,
} from '../types/travelServices';

export const weatherService = {
  /**
   * Fetches current meteorological conditions in Addis Ababa.
   * GET /api/v1/weather/current
   */
  async getCurrent(
    lat: number,
    lon: number,
    language?: Language
  ): Promise<CurrentWeather & { current: CurrentWeather }> {
    const res = await request<CurrentWeather>('/weather/current', {
      method: 'GET',
      params: { lat, lon, language },
      language,
    });

    return {
      ...res,
      current: res,
    };
  },

  /**
   * Fetches up to 14-day weather forecast projections.
   * GET /api/v1/weather/forecast
   */
  async getForecast(
    lat: number,
    lon: number,
    days = 3,
    language?: Language
  ): Promise<{ forecast: DailyForecast[]; retrievedAt: string }> {
    const res = await request<{ forecast: DailyForecast[]; retrievedAt?: string }>('/weather/forecast', {
      method: 'GET',
      params: { lat, lon, days, language },
      language,
    });

    return {
      forecast: res?.forecast || [],
      retrievedAt: res?.retrievedAt || new Date().toISOString(),
    };
  },

  /**
   * Predicts destination weather and provides clothing/umbrella suggestions.
   * GET /api/v1/weather/arrival-advice
   */
  async getArrivalAdvice(
    lat: number,
    lon: number,
    arrivalTimeOrEta: string | number,
    language?: Language
  ): Promise<ArrivalAdviceData> {
    const params: Record<string, string | number | undefined> = { lat, lon, language };
    if (typeof arrivalTimeOrEta === 'number') {
      params.etaMinutes = arrivalTimeOrEta;
    } else {
      params.arrivalTime = arrivalTimeOrEta;
    }

    return await request<ArrivalAdviceData>('/weather/arrival-advice', {
      method: 'GET',
      params,
      language,
    });
  },

  /**
   * Aggregates current conditions, forecast, and arrival advice in parallel.
   */
  async getFullWeather(
    lat: number,
    lon: number,
    arrivalTime?: string,
    language?: Language
  ): Promise<WeatherData | null> {
    try {
      // 1. Fetch current conditions (primary requirement)
      const currentRes = await this.getCurrent(lat, lon, language);

      // 2. Concurrently fetch forecast and arrival advice
      const [forecastSettled, adviceSettled] = await Promise.allSettled([
        this.getForecast(lat, lon, 3, language),
        arrivalTime ? this.getArrivalAdvice(lat, lon, arrivalTime, language) : Promise.resolve(null),
      ]);

      const forecast = forecastSettled.status === 'fulfilled' ? forecastSettled.value.forecast : [];
      const arrivalAdvice = adviceSettled.status === 'fulfilled' ? adviceSettled.value : null;

      return {
        location: { lat, lon },
        current: currentRes.current as any,
        forecast: forecast as any,
        arrivalAdvice: arrivalAdvice as any,
        provider: currentRes.provider || 'weatherapi',
        retrievedAt: currentRes.retrievedAt || new Date().toISOString(),
        cached: Boolean(currentRes.cached),
      };
    } catch {
      return null;
    }
  },
};
