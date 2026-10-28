import { request } from '../lib/apiClient';
import {
  UserProfile,
  UpdateProfilePayload,
  NotificationPreferences,
  UpdatePreferencesPayload,
  AdminListUsersQuery,
  AdminUpdateUserStatusPayload,
  PaginatedUsersResponse,
} from '../types/users';

export const userService = {
  /**
   * Fetches the current traveler's profile and aggregated community participation stats
   * GET /api/v1/users/me
   */
  async getProfile(): Promise<UserProfile> {
    return await request<UserProfile>('/users/me', {
      method: 'GET',
    });
  },

  /**
   * Updates current user's display name and/or preferredLanguage
   * PATCH /api/v1/users/me
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    return await request<UserProfile>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieves user's notification preferences (radius & incident categories)
   * GET /api/v1/users/me/notification-preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return await request<NotificationPreferences>('/users/me/notification-preferences', {
      method: 'GET',
    });
  },

  /**
   * Updates notification preferences (enabled, radiusMeters, incidentTypes)
   * PATCH /api/v1/users/me/notification-preferences
   */
  async updateNotificationPreferences(payload: UpdatePreferencesPayload): Promise<NotificationPreferences> {
    return await request<NotificationPreferences>('/users/me/notification-preferences', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Admin: List users with search and filters
   * GET /api/v1/users
   */
  async listUsers(query?: AdminListUsersQuery): Promise<{ items: UserProfile[]; meta?: { page: number; limit: number; total: number; totalPages: number } }> {
    return await request<PaginatedUsersResponse>('/users', {
      method: 'GET',
      params: query as Record<string, string | number | boolean | undefined | null>,
    });
  },

  /**
   * Admin: Change user role or suspend/reactivate account
   * PATCH /api/v1/users/:id/status
   */
  async updateUserStatus(userId: string, payload: AdminUpdateUserStatusPayload): Promise<UserProfile> {
    return await request<UserProfile>(`/users/${encodeURIComponent(userId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
