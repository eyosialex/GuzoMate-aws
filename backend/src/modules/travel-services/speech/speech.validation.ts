import { z } from 'zod';
import { env } from '../../../config/env.js';

const ALLOWED_AUDIO_FORMATS = ['wav', 'mp3', 'webm', 'ogg', 'm4a', 'mp4'] as const;
const ALLOWED_MIME_TYPES = [
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/webm',
  'audio/ogg',
  'audio/x-m4a',
  'audio/mp4',
  'audio/aac',
] as const;

export const speechTranscriptionSchema = z.object({
  audio: z.string({ message: 'Audio payload (base64 or URL) is required' }).min(10, 'Audio payload is too short or empty'),
  format: z.enum(ALLOWED_AUDIO_FORMATS).optional(),
  mimeType: z.string().optional(),
  language: z.enum(['en', 'am', 'om']).default('am'),
}).refine(
  (data) => {
    // If mimeType is supplied, verify it is a valid audio format
    if (data.mimeType && !ALLOWED_MIME_TYPES.some((m) => data.mimeType!.toLowerCase().startsWith(m))) {
      return false;
    }
    return true;
  },
  { message: 'Unsupported audio MIME type. Supported: audio/wav, audio/mpeg, audio/webm, audio/ogg, audio/x-m4a' }
).refine(
  (data) => {
    // If audio is base64 string, estimate byte size
    if (data.audio.startsWith('data:') || (!data.audio.startsWith('http://') && !data.audio.startsWith('https://'))) {
      const base64Data = data.audio.includes('base64,') ? data.audio.split('base64,')[1] : data.audio;
      const estimatedBytes = (base64Data.length * 3) / 4;
      if (estimatedBytes > (env.SPEECH_MAX_AUDIO_SIZE_BYTES || 10 * 1024 * 1024)) {
        return false;
      }
    }
    return true;
  },
  { message: `Audio payload exceeds maximum allowed size of ${(env.SPEECH_MAX_AUDIO_SIZE_BYTES || 10485760) / (1024 * 1024)}MB` }
);

export const speechSynthesisSchema = z.object({
  text: z
    .string({ message: 'text string is required for speech synthesis' })
    .min(1, 'Text cannot be empty')
    .max(1000, 'Text exceeds maximum limit of 1000 characters for speech synthesis'),
  language: z.enum(['en', 'am', 'om']).default('am'),
  voiceId: z.string().max(64).optional(),
});

export type SpeechTranscriptionInput = z.infer<typeof speechTranscriptionSchema>;
export type SpeechSynthesisInput = z.infer<typeof speechSynthesisSchema>;
