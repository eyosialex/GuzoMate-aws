import { useState, useEffect, useCallback } from 'react';
import { WeatherData } from '../types';
import { weatherService } from '../services/weatherService';
import { useAppStore } from '../features/useAppStore';

export function useWeather() {
  const userLocation = useAppStore((state) => state.userLocation);
  const language = useAppStore((state) => state.language);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await weatherService.getFullWeather(
        userLocation.lat,
        userLocation.lon,
        new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        language
      );
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
    } finally {
      setIsLoading(false);
    }
  }, [userLocation.lat, userLocation.lon, language]);

  useEffect(() => {
    fetchWeather();
    // Refresh weather data every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return {
    weather,
    isLoading,
    error,
    refresh: fetchWeather,
  };
}
