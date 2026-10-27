import { request, ApiError } from '../lib/apiClient';
import { confirmationsService } from './confirmationsService';
import {
  Incident,
  CreateIncidentPayload,
  UpdateIncidentPayload,
  NearbyIncidentsParams,
  ListIncidentsQuery,
  PaginatedIncidentsResponse,
} from '../types/incidents';

export class DuplicateIncidentError extends Error {
  code = 'DUPLICATE_REPORT';
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateIncidentError';
  }
}

export const incidentsService = {
  /**
   * Fetches road hazards and incidents within a geospatial radius using PostGIS indexing.
   * GET /api/v1/incidents/nearby
   */
  async getNearby(params: NearbyIncidentsParams): Promise<PaginatedIncidentsResponse> {
    const res = await request<{ items?: Incident[] } | PaginatedIncidentsResponse>('/incidents/nearby', {
      method: 'GET',
      params: {
        lat: params.lat,
        lon: params.lon,
        radius: params.radius || params.radiusMeters || 5000,
        type: params.type,
        severity: params.severity,
        status: params.status,
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });

    if (res && 'items' in res && Array.isArray(res.items)) {
      return {
        items: res.items,
        meta: (res as PaginatedIncidentsResponse).meta || {
          page: params.page || 1,
          limit: params.limit || 20,
          total: res.items.length,
          totalPages: 1,
        },
      };
    }

    return { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  },

  /**
   * General incident feed with sorting, status, category, and date range filters.
   * GET /api/v1/incidents
   */
  async listIncidents(query?: ListIncidentsQuery): Promise<PaginatedIncidentsResponse> {
    const res = await request<{ items?: Incident[] } | PaginatedIncidentsResponse>('/incidents', {
      method: 'GET',
      params: {
        type: query?.type,
        severity: query?.severity,
        status: query?.status,
        startDate: query?.startDate,
        endDate: query?.endDate,
        sortBy: query?.sortBy || 'newest',
        page: query?.page || 1,
        limit: query?.limit || 20,
      },
    });

    if (res && 'items' in res && Array.isArray(res.items)) {
      return {
        items: res.items,
        meta: (res as PaginatedIncidentsResponse).meta || {
          page: query?.page || 1,
          limit: query?.limit || 20,
          total: res.items.length,
          totalPages: 1,
        },
      };
    }

    return { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  },

  /**
   * Retrieves single incident details by ID (including current user's voting record if authenticated).
   * GET /api/v1/incidents/:id
   */
  async getIncidentById(id: string): Promise<Incident> {
    return await request<Incident>(`/incidents/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Reports a new crowdsourced road incident.
   * Catches 409 Conflict with code 'DUPLICATE_REPORT' and throws a typed DuplicateIncidentError.
   * POST /api/v1/incidents
   */
  async createIncident(payload: CreateIncidentPayload): Promise<Incident> {
    try {
      return await request<Incident>('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          type: payload.type,
          description: payload.description,
          severity: payload.severity || 'MEDIUM',
          lat: payload.lat,
          lon: payload.lon,
          occurredAt: payload.occurredAt || new Date().toISOString(),
          evidenceUrl: payload.evidenceUrl || undefined,
        }),
      });
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 409 || err.code === 'DUPLICATE_REPORT')) {
        throw new DuplicateIncidentError(err.message || 'A similar incident was recently reported near this location.');
      }
      throw err;
    }
  },

  /**
   * Updates an incident report (allowed for original reporter while PENDING, or Moderator/Admin).
   * PATCH /api/v1/incidents/:id
   */
  async updateIncident(id: string, payload: UpdateIncidentPayload): Promise<Incident> {
    return await request<Incident>(`/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Withdraws or removes an incident report (allowed for reporter while PENDING, or Admin).
   * DELETE /api/v1/incidents/:id
   */
  async deleteIncident(id: string): Promise<{ id: string; deleted: boolean }> {
    return await request<{ id: string; deleted: boolean }>(`/incidents/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Votes on an incident (CONFIRM / DISPUTE) to contribute towards community consensus.
   * Delegates to confirmationsService with { action }.
   * POST /api/v1/incidents/:id/confirm
   */
  async voteOnIncident(
    id: string,
    vote: 'CONFIRM' | 'DISPUTE',
    _comment?: string
  ): Promise<{ success: boolean; confirmationsCount?: number; disputesCount?: number; status?: string }> {
    const res = await confirmationsService.voteOnIncident(id, vote);
    return {
      success: true,
      confirmationsCount: res.confirmationsCount,
      disputesCount: res.disputesCount,
      status: res.status,
    };
  },
};
