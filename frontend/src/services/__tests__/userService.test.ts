// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { userService } from '../userService';
import { formatRadius } from '../../types/users';

describe('Users Module Integration (Phase 2)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('guzomate_token', 'mock_jwt_token_for_phase2');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockUserProfile = {
    id: 'e6a578bc-3212-4299-8cfb-665e729a8f21',
    email: 'traveler@example.com',
    name: 'Abebe Bikila',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    preferredLanguage: 'am' as const,
    createdAt: '2026-10-27T07:45:00.000Z',
    updatedAt: '2026-10-27T07:45:00.000Z',
    stats: {
      reportedIncidentsCount: 14,
      confirmationsCount: 38,
      savedPlacesCount: 7,
    },
  };

  const mockNotificationPreferences = {
    enabled: true,
    radiusMeters: 5000,
    incidentTypes: ['ACCIDENT', 'FLOODING', 'ROAD_BLOCK'],
    updatedAt: '2026-10-27T07:45:00.000Z',
  };

  it('1. should fetch current traveler profile & aggregated stats (GET /users/me)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockUserProfile,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const profile = await userService.getProfile();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/users/me'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock_jwt_token_for_phase2',
        }),
      })
    );

    expect(profile.id).toBe(mockUserProfile.id);
    expect(profile.email).toBe('traveler@example.com');
    expect(profile.name).toBe('Abebe Bikila');
    expect(profile.stats?.reportedIncidentsCount).toBe(14);
    expect(profile.stats?.confirmationsCount).toBe(38);
    expect(profile.stats?.savedPlacesCount).toBe(7);
  });

  it('2. should update traveler profile name and language (PATCH /users/me)', async () => {
    const updatedMock = {
      ...mockUserProfile,
      name: 'Abebe B.',
      preferredLanguage: 'om' as const,
      updatedAt: '2026-10-27T08:12:00.000Z',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: updatedMock,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await userService.updateProfile({
      name: 'Abebe B.',
      preferredLanguage: 'om',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/users/me'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Abebe B.', preferredLanguage: 'om' }),
      })
    );

    expect(result.name).toBe('Abebe B.');
    expect(result.preferredLanguage).toBe('om');
  });

  it('3. should retrieve notification preferences (GET /users/me/notification-preferences)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockNotificationPreferences,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const prefs = await userService.getNotificationPreferences();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/users/me/notification-preferences'),
      expect.objectContaining({
        method: 'GET',
      })
    );

    expect(prefs.enabled).toBe(true);
    expect(prefs.radiusMeters).toBe(5000);
    expect(prefs.incidentTypes).toEqual(['ACCIDENT', 'FLOODING', 'ROAD_BLOCK']);
  });

  it('4. should update notification preferences (PATCH /users/me/notification-preferences)', async () => {
    const updatedPrefs = {
      enabled: true,
      radiusMeters: 10000,
      incidentTypes: ['ACCIDENT', 'ROAD_BLOCK', 'FLOODING', 'CONSTRUCTION'],
      updatedAt: '2026-10-27T08:15:00.000Z',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: updatedPrefs,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await userService.updateNotificationPreferences({
      enabled: true,
      radiusMeters: 10000,
      incidentTypes: ['ACCIDENT', 'ROAD_BLOCK', 'FLOODING', 'CONSTRUCTION'],
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/users/me/notification-preferences'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          enabled: true,
          radiusMeters: 10000,
          incidentTypes: ['ACCIDENT', 'ROAD_BLOCK', 'FLOODING', 'CONSTRUCTION'],
        }),
      })
    );

    expect(result.radiusMeters).toBe(10000);
    expect(result.incidentTypes).toContain('CONSTRUCTION');
  });

  it('5. should support Admin user listing (GET /users)', async () => {
    const mockList = {
      items: [mockUserProfile],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockList,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await userService.listUsers({ search: 'Abebe', page: 1 });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/users?search=Abebe&page=1'),
      expect.objectContaining({ method: 'GET' })
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].email).toBe('traveler@example.com');
  });

  it('6. should support Admin changing user status / role (PATCH /users/:id/status)', async () => {
    const updatedAdminTarget = {
      ...mockUserProfile,
      role: 'MODERATOR' as const,
      status: 'ACTIVE' as const,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: updatedAdminTarget,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await userService.updateUserStatus('e6a578bc-3212-4299-8cfb-665e729a8f21', {
      role: 'MODERATOR',
      status: 'ACTIVE',
      reason: 'Promoted to community moderator',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/users/e6a578bc-3212-4299-8cfb-665e729a8f21/status'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          role: 'MODERATOR',
          status: 'ACTIVE',
          reason: 'Promoted to community moderator',
        }),
      })
    );

    expect(result.role).toBe('MODERATOR');
  });

  it('7. formatRadius helper formats meters to human-readable strings correctly', () => {
    expect(formatRadius(500)).toBe('500 m');
    expect(formatRadius(800)).toBe('800 m');
    expect(formatRadius(1000)).toBe('1 km');
    expect(formatRadius(2500)).toBe('2.5 km');
    expect(formatRadius(5000)).toBe('5 km');
    expect(formatRadius(50000)).toBe('50 km');
  });

  it('8. should handle 401 Unauthorized gracefully and clean session tokens', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Token expired' },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    );

    let logoutEventFired = false;
    window.addEventListener('auth:logout', () => {
      logoutEventFired = true;
    }, { once: true });

    await expect(userService.getProfile()).rejects.toThrow();
    expect(localStorage.getItem('guzomate_token')).toBeNull();
    expect(logoutEventFired).toBe(true);
  });
});
