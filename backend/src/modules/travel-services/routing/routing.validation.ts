import { z } from 'zod';

export const routeQuerySchema = z.object({
  originLat: z.coerce
    .number({ message: 'originLat must be a valid number' })
    .min(-90, 'originLat must be between -90 and 90')
    .max(90, 'originLat must be between -90 and 90'),
  originLon: z.coerce
    .number({ message: 'originLon must be a valid number' })
    .min(-180, 'originLon must be between -180 and 180')
    .max(180, 'originLon must be between -180 and 180'),
  destLat: z.coerce.number().min(-90).max(90).optional(),
  destinationLat: z.coerce.number().min(-90).max(90).optional(),
  destLon: z.coerce.number().min(-180).max(180).optional(),
  destinationLon: z.coerce.number().min(-180).max(180).optional(),
  mode: z.enum(['driving', 'walking', 'transit', 'all']).default('driving'),
  language: z.enum(['en', 'am', 'om']).default('en'),
  lang: z.enum(['en', 'am', 'om']).optional(),
  includeIncidents: z.coerce.boolean().default(true),
}).refine(
  (data) => (data.destLat !== undefined || data.destinationLat !== undefined),
  { message: 'Destination latitude (destLat or destinationLat) is required' }
).refine(
  (data) => (data.destLon !== undefined || data.destinationLon !== undefined),
  { message: 'Destination longitude (destLon or destinationLon) is required' }
).transform((data) => ({
  originLat: data.originLat,
  originLon: data.originLon,
  destLat: (data.destLat ?? data.destinationLat)!,
  destLon: (data.destLon ?? data.destinationLon)!,
  mode: data.mode,
  language: data.lang || data.language,
  includeIncidents: data.includeIncidents,
}));

export type RouteQuery = z.infer<typeof routeQuerySchema>;
