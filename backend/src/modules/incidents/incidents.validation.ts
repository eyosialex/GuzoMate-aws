import { z } from 'zod';
import { IncidentType, IncidentSeverity, IncidentStatus } from '@prisma/client';

export const createIncidentSchema = z.object({
  type: z.enum([
    'ACCIDENT',
    'ROAD_BLOCK',
    'ROAD_CLOSURE',
    'FLOODING',
    'LANDSLIDE',
    'ROAD_DAMAGE',
    'CONSTRUCTION',
    'HEAVY_TRAFFIC',
    'HAZARD',
    'OTHER',
  ] as const),
  description: z.string().trim().min(5, 'Description must be at least 5 characters').max(2000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).default('MEDIUM'),
  lat: z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90),
  lon: z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180),
  occurredAt: z.coerce.date().optional(),
  evidenceUrl: z.string().url('Invalid URL format').max(1024).optional(),
});

export const updateIncidentSchema = z.object({
  description: z.string().trim().min(5).max(2000).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).optional(),
  evidenceUrl: z.string().url().max(1024).optional().nullable(),
});

export const nearbyIncidentsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(50000).default(5000),
  type: z.enum([
    'ACCIDENT',
    'ROAD_BLOCK',
    'ROAD_CLOSURE',
    'FLOODING',
    'LANDSLIDE',
    'ROAD_DAMAGE',
    'CONSTRUCTION',
    'HEAVY_TRAFFIC',
    'HAZARD',
    'OTHER',
  ] as const).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'RESOLVED', 'REJECTED', 'EXPIRED'] as const).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listIncidentsQuerySchema = z.object({
  type: z.enum([
    'ACCIDENT',
    'ROAD_BLOCK',
    'ROAD_CLOSURE',
    'FLOODING',
    'LANDSLIDE',
    'ROAD_DAMAGE',
    'CONSTRUCTION',
    'HEAVY_TRAFFIC',
    'HAZARD',
    'OTHER',
  ] as const).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'RESOLVED', 'REJECTED', 'EXPIRED'] as const).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['newest', 'oldest', 'severity']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
export type NearbyIncidentsQuery = z.infer<typeof nearbyIncidentsQuerySchema>;
export type ListIncidentsQuery = z.infer<typeof listIncidentsQuerySchema>;
