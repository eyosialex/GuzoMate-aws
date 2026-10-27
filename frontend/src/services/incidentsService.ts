import { request } from '../lib/apiClient';
import { Incident, IncidentSubmissionPayload, IncidentNearbyResponse, IncidentType, IncidentStatus } from '../types';

export interface NearbyIncidentsParams {
  lat: number;
  lon: number;
  radiusMeters?: number;
  type?: IncidentType;
  status?: IncidentStatus;
}

export const incidentsService = {
  async getNearby(params: NearbyIncidentsParams): Promise<IncidentNearbyResponse> {
    try {
      const res = await request<{ items?: Incident[] } | IncidentNearbyResponse>('/incidents/nearby', {
        method: 'GET',
        params: {
          lat: params.lat,
          lon: params.lon,
          radius: params.radiusMeters || 10000,
          type: params.type,
          status: params.status,
        },
      });

      const items = (res && 'items' in res && Array.isArray(res.items)) ? res.items : [];
      return {
        items,
        nextCursor: (res as any)?.nextCursor || null,
      };
    } catch {
      return { items: [], nextCursor: null };
    }
  },

  async createIncident(payload: IncidentSubmissionPayload): Promise<Incident> {
    return await request<Incident>('/incidents', {
      method: 'POST',
      body: JSON.stringify({
        type: payload.type,
        description: payload.description,
        lat: payload.location.lat,
        lon: payload.location.lon,
        occurredAt: payload.occurredAt || new Date().toISOString(),
      }),
    });
  },

  async confirmIncident(id: string, confirmationType: 'STILL_PRESENT' | 'RESOLVED' | 'INACCURATE'): Promise<{ success: boolean }> {
    return await request<{ success: boolean }>(`/incidents/${id}/confirmations`, {
      method: 'POST',
      body: JSON.stringify({ confirmationType }),
    });
  },
};
