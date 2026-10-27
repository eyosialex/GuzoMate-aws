// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService, AuthApiError } from '../authService';

describe('Auth Module Integration (Phase 1)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockUserResponse = {
    id: 'usr-12345-uuid',
    email: 'traveler@example.com',
    name: 'Abebe Bikila',
    role: 'USER',
    status: 'ACTIVE',
    preferredLanguage: 'am',
    createdAt: '2026-10-27T07:45:00.000Z',
    updatedAt: '2026-10-27T07:45:00.000Z',
  };

  const mockAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken123';

  it('1. should successfully register a new traveler account', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            user: mockUserResponse,
            accessToken: mockAccessToken,
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await authService.register({
      email: 'traveler@example.com',
      password: 'Password123',
      name: 'Abebe Bikila',
      preferredLanguage: 'am',
    });

    expect(result.accessToken).toBe(mockAccessToken);
    expect(result.user.id).toBe(mockUserResponse.id);
    expect(result.user.email).toBe('traveler@example.com');
    expect(result.user.name).toBe('Abebe Bikila');
    expect(result.user.role).toBe('USER');
    expect(result.user.preferredLanguage).toBe('am');

    // Token & user persistence in localStorage per section 4.1
    expect(localStorage.getItem('guzomate_token')).toBe(mockAccessToken);
    expect(JSON.parse(localStorage.getItem('guzomate_user')!).email).toBe('traveler@example.com');
  });

  it('2. should reject registration when email already exists with 409 CONFLICT', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A user with this email address already exists.',
          },
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    );

    try {
      await authService.register({
        email: 'duplicate@example.com',
        password: 'Password123',
        name: 'Duplicate Traveler',
      });
      expect.fail('Should have thrown AuthApiError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AuthApiError);
      expect(err.code).toBe('CONFLICT');
      expect(err.status).toBe(409);
      expect(err.message).toBe('A user with this email address already exists.');
    }
  });

  it('3. should reject registration with validation error (400 VALIDATION_ERROR)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: [{ path: ['password'], message: 'Password must contain at least one number' }],
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    );

    try {
      await authService.register({
        email: 'weak@example.com',
        password: 'weakpassword',
      });
      expect.fail('Should have thrown AuthApiError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AuthApiError);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.status).toBe(400);
      expect(err.details).toBeDefined();
    }
  });

  it('4. should successfully login with valid credentials', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            user: mockUserResponse,
            accessToken: mockAccessToken,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await authService.login({
      email: 'traveler@example.com',
      password: 'Password123',
    });

    expect(result.accessToken).toBe(mockAccessToken);
    expect(result.user.email).toBe('traveler@example.com');
    expect(localStorage.getItem('guzomate_token')).toBe(mockAccessToken);
  });

  it('5. should reject login with invalid password (401 UNAUTHORIZED)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password.',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    );

    try {
      await authService.login({
        email: 'traveler@example.com',
        password: 'WrongPassword999',
      });
      expect.fail('Should have thrown AuthApiError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AuthApiError);
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.status).toBe(401);
    }
  });

  it('6. should reject login for suspended account (403 FORBIDDEN)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Your account has been suspended. Please contact moderation.',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    );

    try {
      await authService.login({
        email: 'suspended@example.com',
        password: 'Password123',
      });
      expect.fail('Should have thrown AuthApiError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AuthApiError);
      expect(err.code).toBe('FORBIDDEN');
      expect(err.status).toBe(403);
    }
  });

  it('7. should resolve current user profile via /auth/me with Bearer token', async () => {
    localStorage.setItem('guzomate_token', mockAccessToken);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            user: mockUserResponse,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const user = await authService.getCurrentUser();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      })
    );
    expect(user?.email).toBe('traveler@example.com');
    expect(user?.status).toBe('ACTIVE');
  });

  it('8. should clear storage and emit auth:logout on expired / invalid token from /auth/me', async () => {
    localStorage.setItem('guzomate_token', 'expired-token');
    localStorage.setItem('guzomate_user', JSON.stringify(mockUserResponse));

    const logoutEventSpy = vi.fn();
    window.addEventListener('auth:logout', logoutEventSpy);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token expired',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const user = await authService.getCurrentUser();

    expect(user).toBeNull();
    expect(localStorage.getItem('guzomate_token')).toBeNull();
    expect(localStorage.getItem('guzomate_user')).toBeNull();
    expect(logoutEventSpy).toHaveBeenCalled();

    window.removeEventListener('auth:logout', logoutEventSpy);
  });
});
