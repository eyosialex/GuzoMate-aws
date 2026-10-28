import { request } from '../lib/apiClient';
import { CurrentWeather, DailyForecast, ArrivalAdvice, WeatherData, Language } from '../types';

export const weatherService = {
  async getCurrent(
    lat: number, 
    lon: number, 
    language?: Language
  ): Promise<{ current: CurrentWeather; retrievedAt: string; provider: string; cached?: boolean }> {
    return await request('/weather/current', {
      method: 'GET',
      params: { lat, lon, language },
      language,
    });
  },

  async getForecast(
    lat: number, 
    lon: number, 
    days = 3, 
    language?: Language
  ): Promise<{ forecast: DailyForecast[]; retrievedAt: string; provider: string; cached?: boolean }> {
    return await request('/weather/forecast', {
      method: 'GET',
      params: { lat, lon, days, language },
      language,
    });
  },

  async getArrivalAdvice(
    lat: number, 
    lon: number, 
    arrivalTime: string, 
    language?: Language
  ): Promise<ArrivalAdvice> {
    return await request<ArrivalAdvice>('/weather/arrival-advice', {
      method: 'GET',
      params: { lat, lon, arrivalTime, language },
      language,
    });
  },

  async getFullWeather(
    lat: number, 
    lon: number, 
    arrivalTime?: string, 
    language?: Language
  ): Promise<WeatherData> {
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
      current: currentRes.current,
      forecast,
      arrivalAdvice,
      provider: currentRes.provider || 'weatherapi',
      retrievedAt: currentRes.retrievedAt || new Date().toISOString(),
      cached: Boolean(currentRes.cached),
    };
  },
};
