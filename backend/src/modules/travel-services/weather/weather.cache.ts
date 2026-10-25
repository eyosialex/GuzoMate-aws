import { prisma } from '../../../config/database.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import { NormalizedWeatherData } from './weather.types.js';

interface MemoryCacheEntry {
  data: NormalizedWeatherData;
  validUntil: number;
}

export class WeatherCacheService {
  private memoryCache: Map<string, MemoryCacheEntry> = new Map();
  private ttlMinutes: number;

  constructor(ttlMinutes = env.WEATHER_CACHE_TTL_MINUTES || 20) {
    this.ttlMinutes = ttlMinutes;
  }

  public getCacheKey(lat: number, lon: number, days = 3): string {
    // Round to 2 decimal places (~1.1km grid) to optimize meteorological caching
    return `weather:${lat.toFixed(2)}:${lon.toFixed(2)}:${days}`;
  }

  public async get(cacheKey: string): Promise<NormalizedWeatherData | null> {
    const nowMs = Date.now();

    // 1. Check in-memory cache first
    const mem = this.memoryCache.get(cacheKey);
    if (mem && mem.validUntil > nowMs) {
      return mem.data;
    }

    // 2. Check Prisma WeatherCache table
    try {
      const record = await prisma.weatherCache.findUnique({
        where: { cacheKey },
      });

      if (record && record.validUntil.getTime() > nowMs) {
        const data = record.forecastJson as unknown as NormalizedWeatherData;
        // Warm up memory cache
        this.memoryCache.set(cacheKey, {
          data,
          validUntil: record.validUntil.getTime(),
        });
        return data;
      }
    } catch (err: any) {
      logger.warn('[WeatherCache] Database cache read failed, continuing with memory cache', {
        cacheKey,
        error: err.message,
      });
    }

    return null;
  }

  public async set(
    cacheKey: string,
    lat: number,
    lon: number,
    data: NormalizedWeatherData
  ): Promise<void> {
    const now = new Date();
    const validUntil = new Date(now.getTime() + this.ttlMinutes * 60 * 1000);

    // 1. Store in memory cache
    this.memoryCache.set(cacheKey, {
      data,
      validUntil: validUntil.getTime(),
    });

    // 2. Persist to Prisma WeatherCache table
    try {
      await prisma.weatherCache.upsert({
        where: { cacheKey },
        create: {
          cacheKey,
          latitude: lat,
          longitude: lon,
          provider: data.provider,
          forecastJson: data as any,
          retrievedAt: now,
          validUntil,
        },
        update: {
          latitude: lat,
          longitude: lon,
          provider: data.provider,
          forecastJson: data as any,
          retrievedAt: now,
          validUntil,
        },
      });
    } catch (err: any) {
      logger.warn('[WeatherCache] Database cache write failed, persisted in memory only', {
        cacheKey,
        error: err.message,
      });
    }
  }

  public clearMemory(): void {
    this.memoryCache.clear();
  }
}

export const weatherCache = new WeatherCacheService();
