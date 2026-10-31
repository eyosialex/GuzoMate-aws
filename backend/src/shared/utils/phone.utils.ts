/**
 * Utilities for phone number normalization, validation, and Gmail domain checks.
 */

/**
 * Normalizes a given phone number into consistent E.164 format.
 * Specifically handles Ethiopian numbers (e.g., 0911234567, 0712345678, 251911234567, +251911234567)
 * as well as general international E.164 formats (+[1-9][0-9]{7,14}).
 *
 * @throws Error if the phone number cannot be parsed into a valid format.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new Error('Phone number must be provided as a non-empty string.');
  }

  // Remove common separators, spaces, and punctuation
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Ethiopian mobile numbers starting with local 09 or 07 (10 digits total)
  if (/^0[79]\d{8}$/.test(cleaned)) {
    cleaned = '+251' + cleaned.slice(1);
  }
  // Ethiopian mobile numbers starting with 9 or 7 without leading zero (9 digits total)
  else if (/^[79]\d{8}$/.test(cleaned)) {
    cleaned = '+251' + cleaned;
  }
  // Ethiopian numbers starting with 251 without '+' (12 digits total)
  else if (/^251[79]\d{8}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }

  // Validate final E.164 representation: '+' followed by 8 to 15 digits
  if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) {
    throw new Error(
      'Invalid phone number format. Must be a valid phone number (e.g., +251911234567 or 0911234567).'
    );
  }

  return cleaned;
}

/**
 * Checks whether a phone number can be normalized into valid E.164 format.
 */
export function isValidPhoneNumber(rawPhone: string): boolean {
  try {
    normalizePhoneNumber(rawPhone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates whether an email ends with @gmail.com (case-insensitive, trimmed).
 */
export function isGmailAddress(rawEmail: string): boolean {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return false;
  }

  const cleaned = rawEmail.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) && cleaned.endsWith('@gmail.com');
}
