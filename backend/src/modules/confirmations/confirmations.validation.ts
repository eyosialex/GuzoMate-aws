import { z } from 'zod';

export const confirmIncidentSchema = z.object({
  action: z.enum(['CONFIRM', 'DISPUTE'] as const),
});

export type ConfirmIncidentInput = z.infer<typeof confirmIncidentSchema>;
