import { z } from 'zod';

export const registerDeviceTokenSchema = z.object({
  token: z.string().trim().min(10, 'Device token must be at least 10 characters').max(512),
  platform: z.enum(['ios', 'android', 'web']).default('web'),
});

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
