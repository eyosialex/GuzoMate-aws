// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notificationsService } from '../notificationsService';
import { InAppNotification, NotificationsListResponse } from '../../types/notifications';

describe('Notifications Module Integration (Phase 5)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('guzomate_token', 'mock_jwt_token_for_phase5');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockNotification: InAppNotification = {
    id: '908d17f3-e5e5-47e1-8f55-1082aa376d29',
    userId: 'e6a578bc-3212-4299-8cfb-665e729a8f21',
    incidentId: 'c71e21b0-449e-4e4a-b5e1-8f5bc65181a9',
    type: 'INCIDENT_ALERT',
    title: '🚨 Road Alert: FLOODING',
    message: 'Heavy water accumulation near Gotera interchange underpass.',
    isRead: false,
    deliveryStatus: 'SENT',
    deliveredAt: '2026-10-27T10:35:00.000Z',
    createdAt: '2026-10-27T10:35:00.000Z',
    updatedAt: '2026-10-27T10:35:00.000Z',
  };

  it('1. should register a device push token (POST /notifications/devices)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'dev-token-uuid-1',
            token: 'fcm_mock_device_token_sample_12345',
            platform: 'web',
            isActive: true,
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await notificationsService.registerDevice('fcm_mock_device_token_sample_12345', 'web');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('/notifications/devices');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      token: 'fcm_mock_device_token_sample_12345',
      platform: 'web',
    });
    expect(result.isActive).toBe(true);
    expect(result.platform).toBe('web');
  });

  it('2. should deactivate device push token on logout (DELETE /notifications/devices/:token)', async () => {
    const token = 'fcm_mock_device_token_sample_12345';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            token,
            active: false,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await notificationsService.removeDevice(token);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain(`/notifications/devices/${token}`);
    expect(init?.method).toBe('DELETE');
    expect(result.active).toBe(false);
  });

  it('3. should list traveler notifications and unreadCount (GET /notifications)', async () => {
    const mockListResponse: NotificationsListResponse = {
      items: [mockNotification],
      unreadCount: 1,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockListResponse,
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await notificationsService.getNotifications({ page: 1, limit: 10 });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('/notifications?page=1&limit=10');
    expect(result.items.length).toBe(1);
    expect(result.unreadCount).toBe(1);
    expect(result.items[0].title).toBe('🚨 Road Alert: FLOODING');
  });

  it('4. should filter by unreadOnly when requested (GET /notifications?unreadOnly=true)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [mockNotification],
            unreadCount: 1,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await notificationsService.getNotifications({ unreadOnly: true });

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('unreadOnly=true');
  });

  it('5. should mark a single notification as read (PATCH /notifications/:id/read)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            ...mockNotification,
            isRead: true,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await notificationsService.markAsRead(mockNotification.id);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain(`/notifications/${mockNotification.id}/read`);
    expect(init?.method).toBe('PATCH');
    expect(result.isRead).toBe(true);
  });

  it('6. should mark all notifications as read in bulk (PATCH /notifications/read-all)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            updatedCount: 3,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await notificationsService.markAllAsRead();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('/notifications/read-all');
    expect(init?.method).toBe('PATCH');
    expect(result.updatedCount).toBe(3);
  });
});
