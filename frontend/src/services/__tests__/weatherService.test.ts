// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { weatherService } from '../weatherService';
import {
  CurrentWeather,
  DailyForecast,
  ArrivalAdviceData,
} from '../../types/travelServices';

describe('Weather Services Module Integration (Phase 9)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockCurrentWeather: CurrentWeather = {
    location: { lat: 9.03, lon: 38.74 },
    temperatureC: 21.4,
    condition: 'ደመናማ',
    conditionCode: 'cloudy',
    humidityPercent: 62,
    precipitationMm: 0.0,
    windKph: 9.5,
    feelsLikeC: 21.0,
    isDay: true,
    language: 'am',
    provider: 'weatherapi',
    retrievedAt: '2026-10-27T10:45:00.000Z',
    cached: true,
  };

  it('1. should fetch current meteorological conditions (GET /weather/current)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockCurrentWeather,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await weatherService.getCurrent(9.03, 38.74, 'am');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('/weather/current?lat=9.03&lon=38.74&language=am');
    expect(result.temperatureC).toBe(21.4);
    expect(result.condition).toBe('ደመናማ');
    expect(result.current.feelsLikeC).toBe(21.0);
  });

  it('2. should fetch multi-day weather forecast projections (GET /weather/forecast)', async () => {
    const mockForecast: DailyForecast[] = [
      {
        date: '2026-10-27',
        maxTempC: 23.5,
        minTempC: 12.0,
        avgTempC: 17.8,
        condition: 'Partly Cloudy',
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            location: { lat: 9.03, lon: 38.74 },
            forecast: mockForecast,
            provider: 'weatherapi',
            retrievedAt: '2026-10-27T10:45:00.000Z',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await weatherService.getForecast(9.03, 38.74, 5, 'en');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('/weather/forecast?lat=9.03&lon=38.74&days=5&language=en');
    expect(result.forecast.length).toBe(1);
    expect(result.forecast[0].maxTempC).toBe(23.5);
  });

  it('3. should fetch destination arrival weather advice with clothing recommendations (GET /weather/arrival-advice)', async () => {
    const mockAdvice: ArrivalAdviceData = {
      location: { lat: 9.03, lon: 38.74 },
      arrivalTime: '2026-10-27T16:30:00.000Z',
      forecastAtArrival: {
        temperatureC: 17.0,
        condition: 'Light Rain Shower',
        precipitationProbability: 70,
      },
      suggestions: [
        {
          type: 'umbrella',
          text: 'Carry an umbrella or raincoat.',
          reason: 'Rain probability is 70% around your arrival time.',
        },
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockAdvice,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await weatherService.getArrivalAdvice(9.03, 38.74, '2026-10-27T16:30:00.000Z', 'en');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('/weather/arrival-advice');
    expect(url).toContain('arrivalTime=2026-10-27T16%3A30%3A00.000Z');
    expect(result.suggestions.length).toBe(1);
    expect(result.suggestions[0].type).toBe('umbrella');
  });

  it('4. should aggregate full weather combining current, forecast, and advice', async () => {
    vi.spyOn(weatherService, 'getCurrent').mockResolvedValueOnce({
      ...mockCurrentWeather,
      current: mockCurrentWeather,
    });
    vi.spyOn(weatherService, 'getForecast').mockResolvedValueOnce({
      forecast: [
        {
          date: '2026-10-27',
          maxTempC: 22.0,
          minTempC: 13.0,
          avgTempC: 17.5,
          condition: 'Sunny',
        },
      ],
      retrievedAt: '2026-10-27T10:45:00.000Z',
    });

    const full = await weatherService.getFullWeather(9.03, 38.74, undefined, 'en');

    expect(full).not.toBeNull();
    expect(full?.current.temperatureC).toBe(21.4);
    expect(full?.forecast.length).toBe(1);
    expect(full?.provider).toBe('weatherapi');
  });
});
