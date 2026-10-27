import { request } from '../lib/apiClient';
import {
  DevicePlatform,
  RegisterDevicePayload,
  RegisteredDevice,
  InAppNotification,
  ListNotificationsQuery,
  NotificationsListResponse,
} from '../types/notifications';

export const notificationsService = {
  /**
   * Registers a device push token (FCM / Web Push / APNs) for the authenticated user.
   * POST /api/v1/notifications/devices
   */
  async registerDevice(
    token: string,
    platform: DevicePlatform = 'web'
  ): Promise<RegisteredDevice> {
    return await request<RegisteredDevice>('/notifications/devices', {
      method: 'POST',
      body: JSON.stringify({ token, platform } as RegisterDevicePayload),
    });
  },

  /**
   * Deactivates a device push token upon traveler sign-out.
   * DELETE /api/v1/notifications/devices/:token
   */
  async removeDevice(token: string): Promise<{ token: string; active: boolean }> {
    return await request<{ token: string; active: boolean }>(
      `/notifications/devices/${encodeURIComponent(token)}`,
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * Retrieves in-app notifications and real-time unreadCount for the traveler.
   * GET /api/v1/notifications
   */
  async getNotifications(
    query?: ListNotificationsQuery
  ): Promise<NotificationsListResponse> {
    const params: Record<string, string | number | undefined> = {};
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;
    if (query?.unreadOnly !== undefined) params.unreadOnly = query.unreadOnly ? 'true' : 'false';

    const res = await request<NotificationsListResponse>('/notifications', {
      method: 'GET',
      params,
    });

    return {
      items: res?.items || [],
      unreadCount: res?.unreadCount ?? 0,
    };
  },

  /**
   * Marks a single notification as read.
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(notificationId: string): Promise<InAppNotification> {
    return await request<InAppNotification>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Clears all unread notifications in one click.
   * PATCH /api/v1/notifications/read-all
   */
  async markAllAsRead(): Promise<{ updatedCount: number }> {
    return await request<{ updatedCount: number }>('/notifications/read-all', {
      method: 'PATCH',
    });
  },
};
