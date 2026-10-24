import { request } from '../lib/apiClient';
import { CurrentWeather, DailyForecast, ArrivalAdvice, WeatherData, Language } from '../types';
import { MOCK_WEATHER } from '../lib/mockData';

const isMockForced = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const weatherService = {
  async getCurrent(lat: number, lon: number, language?: Language): Promise<{ current: CurrentWeather; retrievedAt: string; provider: string }> {
    if (!isMockForced) {
      try {
        return await request('/weather/current', {
          method: 'GET',
          params: { lat, lon },
          language,
        });
      } catch (error) {
        console.warn('Backend unavailable, returning mock current weather:', error);
      }
    }
    return {
      current: MOCK_WEATHER.current,
      retrievedAt: new Date().toISOString(),
      provider: 'weatherapi',
    };
  },

  async getForecast(lat: number, lon: number, days = 1, language?: Language): Promise<{ forecast: DailyForecast[]; retrievedAt: string }> {
    if (!isMockForced) {
      try {
        return await request('/weather/forecast', {
          method: 'GET',
          params: { lat, lon, days },
          language,
        });
      } catch (error) {
        console.warn('Backend unavailable, returning mock forecast:', error);
      }
    }
    return {
      forecast: MOCK_WEATHER.forecast,
      retrievedAt: new Date().toISOString(),
    };
  },

  async getArrivalAdvice(lat: number, lon: number, arrivalTime: string, language?: Language): Promise<ArrivalAdvice> {
    if (!isMockForced) {
      try {
        return await request<ArrivalAdvice>('/weather/arrival-advice', {
          method: 'GET',
          params: { lat, lon, arrivalTime },
          language,
        });
      } catch (error) {
        console.warn('Backend unavailable, returning mock arrival advice:', error);
      }
    }
    return MOCK_WEATHER.arrivalAdvice!;
  },

  async getFullWeather(lat: number, lon: number, arrivalTime?: string, language?: Language): Promise<WeatherData> {
    if (!isMockForced) {
      try {
        const [currentRes, forecastRes, adviceRes] = await Promise.allSettled([
          this.getCurrent(lat, lon, language),
          this.getForecast(lat, lon, 1, language),
          arrivalTime ? this.getArrivalAdvice(lat, lon, arrivalTime, language) : Promise.resolve(null),
        ]);

        const current = currentRes.status === 'fulfilled' ? currentRes.value.current : MOCK_WEATHER.current;
        const forecast = forecastRes.status === 'fulfilled' ? forecastRes.value.forecast : MOCK_WEATHER.forecast;
        const arrivalAdvice = adviceRes.status === 'fulfilled' ? adviceRes.value : MOCK_WEATHER.arrivalAdvice;

        return {
          location: { lat, lon },
          current,
          forecast,
          arrivalAdvice,
          provider: 'weatherapi',
          retrievedAt: new Date().toISOString(),
          cached: true,
        };
      } catch {
        // Fallback
      }
    }
    return MOCK_WEATHER;
  },
};
