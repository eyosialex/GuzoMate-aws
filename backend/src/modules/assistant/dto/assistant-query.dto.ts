import { z } from 'zod';

export const LocationSchema = z.object({
  lat: z.number().min(-90, 'Must be between -90 and 90.').max(90, 'Must be between -90 and 90.'),
  lon: z.number().min(-180, 'Must be between -180 and 180.').max(180, 'Must be between -180 and 180.'),
});

export const SupportedLanguageSchema = z.enum(['en', 'am', 'om'] as const, {
  message: "Language must be one of 'en', 'am', or 'om'.",
});

export const FiltersSchema = z.object({
  radiusMeters: z.number().positive().min(50).max(50000).optional().default(3000),
  categories: z.array(z.string().min(1)).optional(),
});

export const AssistantQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Query cannot be empty.')
    .max(1000, 'Query cannot exceed 1000 characters.')
    .trim(),
  language: SupportedLanguageSchema.optional(),
  location: LocationSchema.optional(),
  arrivalTime: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'arrivalTime must be a valid ISO 8601 timestamp.' }
    )
    .optional(),
  filters: FiltersSchema.optional(),
  enableVoice: z.boolean().optional(),
  voiceId: z.string().optional(),
  userId: z.string().optional(),
});

export type LocationDto = z.infer<typeof LocationSchema>;
export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>;
export type FiltersDto = z.infer<typeof FiltersSchema>;
export type AssistantQueryDto = z.infer<typeof AssistantQuerySchema>;
