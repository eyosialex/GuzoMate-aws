import { request } from '../lib/apiClient';
import { CurrentWeather, DailyForecast, ArrivalAdvice, WeatherData, Language } from '../types';

export const weatherService = {
  async getCurrent(lat: number, lon: number, language?: Language): Promise<{ current: CurrentWeather; retrievedAt: string; provider: string }> {
    return await request('/weather/current', {
      method: 'GET',
      params: { lat, lon, language },
      language,
    });
  },

  async getForecast(lat: number, lon: number, days = 3, language?: Language): Promise<{ forecast: DailyForecast[]; retrievedAt: string }> {
    return await request('/weather/forecast', {
      method: 'GET',
      params: { lat, lon, days, language },
      language,
    });
  },

  async getArrivalAdvice(lat: number, lon: number, arrivalTime: string, language?: Language): Promise<ArrivalAdvice> {
    return await request<ArrivalAdvice>('/weather/arrival-advice', {
      method: 'GET',
      params: { lat, lon, arrivalTime, language },
      language,
    });
  },

  async getFullWeather(lat: number, lon: number, arrivalTime?: string, language?: Language): Promise<WeatherData | null> {
    try {
      const [currentRes, forecastRes, adviceRes] = await Promise.allSettled([
        this.getCurrent(lat, lon, language),
        this.getForecast(lat, lon, 3, language),
        arrivalTime ? this.getArrivalAdvice(lat, lon, arrivalTime, language) : Promise.resolve(null),
      ]);

      if (currentRes.status !== 'fulfilled') {
        return null;
      }

      const current = currentRes.value.current;
      const forecast = forecastRes.status === 'fulfilled' ? forecastRes.value.forecast : [];
      const arrivalAdvice = adviceRes.status === 'fulfilled' ? adviceRes.value : null;

      return {
        location: { lat, lon },
        current,
        forecast,
        arrivalAdvice,
        provider: currentRes.value.provider || 'weatherapi',
        retrievedAt: currentRes.value.retrievedAt || new Date().toISOString(),
        cached: false,
      };
    } catch {
      return null;
    }
  },
};
