import { z } from 'zod';
import { normalizePhoneNumber, isValidPhoneNumber, isGmailAddress } from '../../shared/utils/phone.utils.js';

export const phoneValidation = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .refine((val) => isValidPhoneNumber(val), {
    message: 'Invalid phone number format. Must be a valid phone number (e.g., +251911234567 or 0911234567).',
  })
  .transform((val) => normalizePhoneNumber(val));

export const emailValidation = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .toLowerCase()
  .refine((val) => isGmailAddress(val), {
    message: 'Only @gmail.com email addresses are allowed.',
  });

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters long')
      .max(100, 'Full name cannot exceed 100 characters'),
    phoneNumber: phoneValidation,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
    preferredLanguage: z.enum(['en', 'am', 'om']).optional().default('en'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  phoneNumber: phoneValidation,
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  phoneNumber: phoneValidation,
  otp: z
    .string()
    .trim()
    .min(4, 'OTP code must be at least 4 digits')
    .max(10, 'OTP code is too long')
    .regex(/^\d+$/, 'OTP must contain numeric digits only'),
});

export const resendOtpSchema = z.object({
  phoneNumber: phoneValidation,
});

export const googleAuthSchema = z
  .object({
    idToken: z.string().trim().min(1).optional(),
    code: z.string().trim().min(1).optional(),
    accessToken: z.string().trim().min(1).optional(),
    redirectUri: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.idToken || data.code || data.accessToken), {
    message: 'Google ID token, authorization code, or access token is required',
    path: ['idToken'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
