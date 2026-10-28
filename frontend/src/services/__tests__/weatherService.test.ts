import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { weatherService } from '../weatherService';
import * as apiClient from '../../lib/apiClient';

describe('weatherService Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly returns live weather and maps humidity and forecast', async () => {
    const mockCurrentRes = {
      location: { lat: 9.0108, lon: 38.7618 },
      current: {
        temperatureC: 21,
        condition: 'Clear sky',
        precipitationMm: 0,
        windKph: 8,
        humidity: 45,
      },
      provider: 'weatherapi',
      retrievedAt: '2026-10-28T10:00:00Z',
      cached: false,
    };

    const mockForecastRes = {
      location: { lat: 9.0108, lon: 38.7618 },
      forecast: [
        {
          date: '2026-10-28',
          hourly: [
            {
              time: '2026-10-28T10:00:00+03:00',
              temperatureC: 21,
              condition: 'Clear sky',
              precipitationProbability: 10,
            },
          ],
        },
      ],
      provider: 'weatherapi',
      retrievedAt: '2026-10-28T10:00:00Z',
      cached: false,
    };

    const mockAdviceRes = {
      arrivalTime: '2026-10-28T11:00:00Z',
      forecast: {
        temperatureC: 22,
        condition: 'Clear sky',
        precipitationProbability: 10,
      },
      suggestions: [
        {
          type: 'clothing',
          text: 'Light highland jacket',
          reason: 'Mild breeze',
        },
      ],
    };

    vi.spyOn(apiClient, 'request').mockImplementation((endpoint: string) => {
      if (endpoint === '/weather/current') return Promise.resolve(mockCurrentRes);
      if (endpoint === '/weather/forecast') return Promise.resolve(mockForecastRes);
      if (endpoint === '/weather/arrival-advice') return Promise.resolve(mockAdviceRes);
      return Promise.reject(new Error('Unknown endpoint'));
    });

    const result = await weatherService.getFullWeather(9.0108, 38.7618, '2026-10-28T11:00:00Z');

    expect(result).toBeDefined();
    expect(result.current.temperatureC).toBe(21);
    expect(result.current.humidity).toBe(45);
    expect(result.current.condition).toBe('Clear sky');
    expect(result.provider).toBe('weatherapi');
    expect(result.cached).toBe(false);
    expect(result.forecast).toHaveLength(1);
    expect(result.arrivalAdvice?.suggestions).toHaveLength(1);
  });

  it('accurately identifies Open-Meteo fallback provider when WeatherAPI is unconfigured', async () => {
    const mockCurrentRes = {
      location: { lat: 9.0108, lon: 38.7618 },
      current: {
        temperatureC: 19,
        condition: 'Partly cloudy',
        precipitationMm: 0.1,
        windKph: 12,
        humidity: 60,
      },
      provider: 'open-meteo',
      retrievedAt: '2026-10-28T10:05:00Z',
      cached: false,
    };

    vi.spyOn(apiClient, 'request').mockResolvedValue(mockCurrentRes);

    const result = await weatherService.getFullWeather(9.0108, 38.7618);

    expect(result.provider).toBe('open-meteo');
    expect(result.current.temperatureC).toBe(19);
    expect(result.current.condition).toBe('Partly cloudy');
  });

  it('propagates provider errors instead of returning fake mock data', async () => {
    vi.spyOn(apiClient, 'request').mockRejectedValueOnce(
      new apiClient.ApiError('Weather forecast service is temporarily unavailable', 'PROVIDER_ERROR', 503)
    );

    await expect(weatherService.getFullWeather(9.0108, 38.7618)).rejects.toThrow(
      'Weather forecast service is temporarily unavailable'
    );
  });
});
