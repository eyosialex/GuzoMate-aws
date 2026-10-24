import { z } from 'zod';
import { IncidentStatus, IncidentType, IncidentSeverity } from '@prisma/client';

export const updateIncidentStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'RESOLVED', 'REJECTED', 'EXPIRED'] as const),
  reason: z.string().trim().max(500).optional(),
}).refine(
  (data) => {
    if (data.status === 'REJECTED' && (!data.reason || data.reason.trim().length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: 'A rejection reason is required when rejecting an incident report.',
    path: ['reason'],
  }
);

export const listModerationIncidentsQuerySchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'RESOLVED', 'REJECTED', 'EXPIRED'] as const).optional(),
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
  disputedOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>;
export type ListModerationIncidentsQuery = z.infer<typeof listModerationIncidentsQuerySchema>;
