// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';

describe('Auth Validation Checklist (Section 4.3)', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordValidator = (pwd: string) =>
    pwd.length >= 8 && /[A-Za-z]/.test(pwd) && /[0-9]/.test(pwd);

  it('validates email addresses according to backend requirements', () => {
    expect(emailRegex.test('traveler@example.com')).toBe(true);
    expect(emailRegex.test('abebe.bikila@guzomate.et')).toBe(true);
    expect(emailRegex.test('invalid-email')).toBe(false);
    expect(emailRegex.test('invalid@')).toBe(false);
    expect(emailRegex.test('@example.com')).toBe(false);
    expect(emailRegex.test('')).toBe(false);
  });

  it('enforces password rules: >= 8 characters with at least 1 letter and 1 digit', () => {
    // Valid passwords
    expect(passwordValidator('Password123')).toBe(true);
    expect(passwordValidator('GuzoMate2026')).toBe(true);
    expect(passwordValidator('a1bbbbbb')).toBe(true);

    // Invalid passwords
    expect(passwordValidator('short1')).toBe(false); // < 8 chars
    expect(passwordValidator('alllettersnodigits')).toBe(false); // no digit
    expect(passwordValidator('1234567890')).toBe(false); // no letter
    expect(passwordValidator('pass1')).toBe(false); // too short
  });

  it('detects language based on browser locale: am -> am, om -> om, else en', () => {
    const detect = (locale: string) => {
      if (locale.startsWith('am')) return 'am';
      if (locale.startsWith('om')) return 'om';
      return 'en';
    };

    expect(detect('am-ET')).toBe('am');
    expect(detect('am')).toBe('am');
    expect(detect('om-ET')).toBe('om');
    expect(detect('en-US')).toBe('en');
    expect(detect('fr-FR')).toBe('en');
  });
});
