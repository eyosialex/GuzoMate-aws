// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { moderationService } from '../moderationService';
import {
  ModerationIncidentItem,
  IncidentHistoryResponse,
  InvalidStatusTransitionError,
} from '../../types/moderation';
import { ApiError } from '../../lib/apiClient';

describe('Moderation Module Integration (Phase 6)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('guzomate_token', 'mock_moderator_jwt_token');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const incidentId = 'c71e21b0-449e-4e4a-b5e1-8f5bc65181a9';

  const mockIncident: ModerationIncidentItem = {
    id: incidentId,
    type: 'ACCIDENT',
    description: 'Multi-car pileup near Bole Medhanialem roundabout.',
    severity: 'CRITICAL',
    status: 'PENDING',
    verification: 'UNVERIFIED',
    location: {
      lat: 8.9954,
      lon: 38.7845,
    },
    confirmationsCount: 1,
    disputesCount: 4,
    occurredAt: '2026-10-27T09:15:00.000Z',
    expiresAt: '2026-10-27T13:15:00.000Z',
    evidenceUrl: 'https://example.com/photos/accident.jpg',
    reporter: {
      id: '7817cbfa-3ff9-49c0-9fbb-8d519b52a781',
      email: 'reporter@example.com',
      name: 'Chala D.',
    },
    createdAt: '2026-10-27T09:15:00.000Z',
    updatedAt: '2026-10-27T09:30:00.000Z',
  };

  it('1. should list incidents for review in moderation queue (GET /moderation/incidents)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [mockIncident],
          },
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await moderationService.listIncidents();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('/moderation/incidents');
    expect(result.items.length).toBe(1);
    expect(result.items[0].id).toBe(incidentId);
    expect(result.items[0].disputesCount).toBe(4);
  });

  it('2. should filter moderation queue by disputedOnly and severity', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [mockIncident],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await moderationService.listIncidents({
      disputedOnly: true,
      severity: 'CRITICAL',
      page: 1,
      limit: 10,
    });

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('disputedOnly=true');
    expect(url).toContain('severity=CRITICAL');
    expect(url).toContain('page=1&limit=10');
  });

  it('3. should successfully transition incident to ACTIVE with MODERATOR_VERIFIED (PATCH /moderation/incidents/:id/status)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: incidentId,
            status: 'ACTIVE',
            verification: 'MODERATOR_VERIFIED',
            updatedAt: '2026-10-27T10:00:00.000Z',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await moderationService.updateStatus(incidentId, {
      status: 'ACTIVE',
      reason: 'Verified on municipal traffic camera feed.',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain(`/moderation/incidents/${incidentId}/status`);
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(init?.body as string)).toEqual({
      status: 'ACTIVE',
      reason: 'Verified on municipal traffic camera feed.',
    });
    expect(result.status).toBe('ACTIVE');
    expect(result.verification).toBe('MODERATOR_VERIFIED');
  });

  it('4. should successfully mark incident as RESOLVED', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: incidentId,
            status: 'RESOLVED',
            verification: 'MODERATOR_VERIFIED',
            updatedAt: '2026-10-27T10:30:00.000Z',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await moderationService.updateStatus(incidentId, {
      status: 'RESOLVED',
      reason: 'Debris cleared by road authority.',
    });

    expect(result.status).toBe('RESOLVED');
  });

  it('5. should reject illegal state machine transition throwing InvalidStatusTransitionError (400 Bad Request)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid incident status transition from REJECTED to RESOLVED.',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await expect(
      moderationService.updateStatus(incidentId, {
        status: 'RESOLVED',
        reason: 'Attempting invalid jump',
      })
    ).rejects.toThrow(InvalidStatusTransitionError);
  });

  it('6. should retrieve audit trail history for an incident (GET /moderation/incidents/:id/history)', async () => {
    const mockHistory: IncidentHistoryResponse = {
      incidentId,
      history: [
        {
          id: 'log-1',
          action: 'MODERATION_STATUS_CHANGE',
          reason: 'Verified on CCTV.',
          metadata: { fromStatus: 'PENDING', toStatus: 'ACTIVE' },
          actor: { id: 'admin-1', name: 'Moderator Sara', role: 'MODERATOR' },
          createdAt: '2026-10-27T09:45:00.000Z',
        },
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockHistory,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await moderationService.getIncidentHistory(incidentId);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain(`/moderation/incidents/${incidentId}/history`);
    expect(result.history.length).toBe(1);
    expect(result.history[0].action).toBe('MODERATION_STATUS_CHANGE');
    expect(result.history[0].actor?.name).toBe('Moderator Sara');
  });

  it('7. should throw 403 Forbidden when a non-staff user attempts moderation operations', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Forbidden: Insufficient role permissions.',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await expect(moderationService.listIncidents()).rejects.toThrow(ApiError);
  });
});
