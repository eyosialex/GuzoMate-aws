import { request, ApiError } from '../lib/apiClient';
import {
  ModerationIncidentItem,
  ListModerationIncidentsQuery,
  UpdateIncidentStatusPayload,
  UpdateIncidentStatusResponse,
  IncidentHistoryResponse,
  InvalidStatusTransitionError,
} from '../types/moderation';

export const moderationService = {
  /**
   * Retrieves prioritized list of incidents for moderation review queue.
   * Prioritizes disputed incidents first.
   * Requires MODERATOR or ADMIN role.
   * GET /api/v1/moderation/incidents
   */
  async listIncidents(
    query?: ListModerationIncidentsQuery
  ): Promise<{ items: ModerationIncidentItem[]; meta?: any }> {
    const params: Record<string, string | number | undefined> = {};
    if (query?.status) params.status = query.status;
    if (query?.type) params.type = query.type;
    if (query?.severity) params.severity = query.severity;
    if (query?.disputedOnly !== undefined) {
      params.disputedOnly = query.disputedOnly ? 'true' : 'false';
    }
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;

    const res = await request<{ items: ModerationIncidentItem[] }>('/moderation/incidents', {
      method: 'GET',
      params,
    });

    return {
      items: res?.items || [],
      meta: (res as any)?.meta,
    };
  },

  /**
   * Overrides or transitions incident status according to state machine rules.
   * If transitioning to REJECTED, reason is mandatory.
   * If transitioning to ACTIVE, verification becomes MODERATOR_VERIFIED.
   * PATCH /api/v1/moderation/incidents/:id/status
   */
  async updateStatus(
    incidentId: string,
    payload: UpdateIncidentStatusPayload
  ): Promise<UpdateIncidentStatusResponse> {
    try {
      return await request<UpdateIncidentStatusResponse>(
        `/moderation/incidents/${incidentId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: payload.status,
            reason: payload.reason?.trim() || undefined,
          }),
        }
      );
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 400) {
        const msg = err.message || '';
        if (msg.toLowerCase().includes('transition') || msg.toLowerCase().includes('invalid')) {
          throw new InvalidStatusTransitionError(msg);
        }
      }
      throw err;
    }
  },

  /**
   * Retrieves complete moderation audit trail and state change history for an incident report.
   * GET /api/v1/moderation/incidents/:id/history
   */
  async getIncidentHistory(incidentId: string): Promise<IncidentHistoryResponse> {
    return await request<IncidentHistoryResponse>(
      `/moderation/incidents/${incidentId}/history`,
      {
        method: 'GET',
      }
    );
  },
};
