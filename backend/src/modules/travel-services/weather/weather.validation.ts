import { z } from 'zod';

export const coordinateSchema = {
  lat: z.coerce
    .number({ message: 'Latitude (lat) must be a valid number' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  lon: z.coerce
    .number({ message: 'Longitude (lon) must be a valid number' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
};

export const languageSchema = z.enum(['en', 'am', 'om']);

export const currentWeatherQuerySchema = z.object({
  lat: coordinateSchema.lat,
  lon: coordinateSchema.lon,
  lang: languageSchema.optional(),
  language: languageSchema.optional(),
}).transform((data) => ({
  lat: data.lat,
  lon: data.lon,
  language: (data.lang || data.language || 'en') as 'en' | 'am' | 'om',
}));

export const forecastWeatherQuerySchema = z.object({
  lat: coordinateSchema.lat,
  lon: coordinateSchema.lon,
  days: z.coerce.number().int().min(1, 'Days must be at least 1').max(14, 'Days cannot exceed 14').default(3),
  lang: languageSchema.optional(),
  language: languageSchema.optional(),
}).transform((data) => ({
  lat: data.lat,
  lon: data.lon,
  days: data.days,
  language: (data.lang || data.language || 'en') as 'en' | 'am' | 'om',
}));

export const arrivalAdviceQuerySchema = z.object({
  lat: coordinateSchema.lat,
  lon: coordinateSchema.lon,
  arrivalTime: z.string().datetime({ offset: true }).optional().or(z.string().optional()),
  etaMinutes: z.coerce.number().min(0).max(10080).optional(),
  lang: languageSchema.optional(),
  language: languageSchema.optional(),
}).refine(
  (data) => Boolean(data.arrivalTime || data.etaMinutes !== undefined),
  { message: 'Either arrivalTime (ISO 8601 string) or etaMinutes (number) must be provided' }
).transform((data) => ({
  lat: data.lat,
  lon: data.lon,
  arrivalTime: data.arrivalTime,
  etaMinutes: data.etaMinutes,
  language: (data.lang || data.language || 'en') as 'en' | 'am' | 'om',
}));

export type CurrentWeatherQuery = z.infer<typeof currentWeatherQuerySchema>;
export type ForecastWeatherQuery = z.infer<typeof forecastWeatherQuerySchema>;
export type ArrivalAdviceQuery = z.infer<typeof arrivalAdviceQuerySchema>;
