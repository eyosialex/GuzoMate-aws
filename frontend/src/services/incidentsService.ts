import { request } from '../lib/apiClient';
import { Incident, IncidentSubmissionPayload, IncidentNearbyResponse, IncidentType, IncidentStatus } from '../types';
import { MOCK_INCIDENTS } from '../lib/mockData';

const isMockForced = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export interface NearbyIncidentsParams {
  lat: number;
  lon: number;
  radiusMeters?: number;
  type?: IncidentType;
  status?: IncidentStatus;
}

export const incidentsService = {
  async getNearby(params: NearbyIncidentsParams): Promise<IncidentNearbyResponse> {
    if (!isMockForced) {
      try {
        return await request<IncidentNearbyResponse>('/incidents/nearby', {
          method: 'GET',
          params: {
            lat: params.lat,
            lon: params.lon,
            radiusMeters: params.radiusMeters || 10000,
            type: params.type,
            status: params.status,
          },
        });
      } catch (error) {
        console.warn('Backend unavailable, using local mock incidents:', error);
      }
    }

    let items = [...MOCK_INCIDENTS];
    if (params.type) items = items.filter((i) => i.type === params.type);
    if (params.status) items = items.filter((i) => i.status === params.status);
    return { items, nextCursor: null };
  },

  async createIncident(payload: IncidentSubmissionPayload): Promise<Incident> {
    if (!isMockForced) {
      try {
        return await request<Incident>('/incidents', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.warn('Backend unavailable, creating local incident report:', error);
      }
    }

    const newIncident: Incident = {
      id: `inc-${Date.now()}`,
      title: payload.title || payload.type.replace('_', ' '),
      type: payload.type,
      description: payload.description,
      status: 'PENDING',
      verification: 'UNVERIFIED',
      location: payload.location,
      locationName: payload.locationName || `${payload.location.lat.toFixed(4)}, ${payload.location.lon.toFixed(4)}`,
      createdAt: new Date().toISOString(),
      confirmationsCount: 1,
    };
    return newIncident;
  },

  async confirmIncident(id: string, confirmationType: 'STILL_PRESENT' | 'RESOLVED' | 'INACCURATE'): Promise<{ success: boolean }> {
    if (!isMockForced) {
      try {
        return await request<{ success: boolean }>(`/incidents/${id}/confirmations`, {
          method: 'POST',
          body: JSON.stringify({ confirmationType }),
        });
      } catch {
        // Fallback
      }
    }
    return { success: true };
  },
};
