import { z } from 'zod';
import { IncidentType, UserRole, UserStatus } from '@prisma/client';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  preferredLanguage: z.enum(['en', 'am', 'om']).optional(),
});

export const updateNotificationPreferencesSchema = z.object({
  enabled: z.boolean().optional(),
  radiusMeters: z.number().int().min(500).max(50000).optional(),
  incidentTypes: z
    .array(
      z.enum([
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
      ] as const)
    )
    .optional(),
});

export const adminUpdateUserSchema = z.object({
  role: z.enum(['USER', 'MODERATOR', 'ADMIN'] as const).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED'] as const).optional(),
  reason: z.string().max(500).optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN'] as const).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED'] as const).optional(),
  search: z.string().trim().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
