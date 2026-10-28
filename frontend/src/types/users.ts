/**
 * Users Module API Contracts & Types
 * Strictly conforms to GuzoMate Users Module Backend Integration Guide v2.0
 */

export type IncidentCategory =
  | 'ACCIDENT'
  | 'ROAD_BLOCK'
  | 'ROAD_CLOSURE'
  | 'FLOODING'
  | 'LANDSLIDE'
  | 'ROAD_DAMAGE'
  | 'CONSTRUCTION'
  | 'HEAVY_TRAFFIC'
  | 'HAZARD'
  | 'OTHER';

export interface UserStats {
  reportedIncidentsCount: number;
  confirmationsCount: number;
  savedPlacesCount: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  preferredLanguage: 'en' | 'am' | 'om';
  createdAt: string;
  updatedAt: string;
  stats?: UserStats;
}

export interface NotificationPreferences {
  enabled: boolean;
  radiusMeters: number;
  incidentTypes: IncidentCategory[];
  updatedAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  preferredLanguage?: 'en' | 'am' | 'om';
}

export interface UpdatePreferencesPayload {
  enabled?: boolean;
  radiusMeters?: number;
  incidentTypes?: IncidentCategory[];
}

export interface AdminListUsersQuery {
  page?: number;
  limit?: number;
  role?: 'USER' | 'MODERATOR' | 'ADMIN';
  status?: 'ACTIVE' | 'SUSPENDED';
  search?: string;
}

export interface AdminUpdateUserStatusPayload {
  role?: 'USER' | 'MODERATOR' | 'ADMIN';
  status?: 'ACTIVE' | 'SUSPENDED';
  reason?: string;
}

export interface PaginatedUsersResponse {
  items: UserProfile[];
}

/**
 * Formats radius meters to human-readable string (e.g. 500 m, 5 km, 12.5 km)
 */
export function formatRadius(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`;
  }
  return `${meters} m`;
}
