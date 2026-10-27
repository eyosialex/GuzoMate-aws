// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { incidentsService, DuplicateIncidentError } from '../incidentsService';
import { Incident, formatDistance } from '../../types/incidents';

describe('Incidents Module Integration (Phase 3)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('guzomate_token', 'mock_jwt_token_for_phase3');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockIncident: Incident = {
    id: 'c71e21b0-449e-4e4a-b5e1-8f5bc65181a9',
    type: 'FLOODING',
    description: 'Heavy water accumulation near Gotera interchange underpass.',
    severity: 'HIGH',
    status: 'ACTIVE',
    verification: 'COMMUNITY_CONFIRMED',
    location: {
      lat: 9.0014,
      lon: 38.7512,
    },
    distanceMeters: 420.5,
    confirmationsCount: 4,
    disputesCount: 0,
    occurredAt: '2026-10-27T10:30:00.000Z',
    expiresAt: '2026-10-27T18:30:00.000Z',
    evidenceUrl: 'https://example.com/flooding.jpg',
    reporter: {
      id: 'e6a578bc-3212-4299-8cfb-665e729a8f21',
      name: 'Abebe Bikila',
    },
    userVote: 'CONFIRM',
    createdAt: '2026-10-27T10:30:00.000Z',
    updatedAt: '2026-10-27T10:40:00.000Z',
  };

  it('1. should fetch nearby incidents via PostGIS spatial query (GET /incidents/nearby)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [mockIncident],
          },
          meta: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const res = await incidentsService.getNearby({
      lat: 9.0014,
      lon: 38.7512,
      radius: 5000,
      type: 'FLOODING',
      severity: 'HIGH',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/nearby?lat=9.0014&lon=38.7512&radius=5000&type=FLOODING&severity=HIGH&page=1&limit=20'),
      expect.objectContaining({ method: 'GET' })
    );

    expect(res.items.length).toBe(1);
    expect(res.items[0].id).toBe(mockIncident.id);
    expect(res.items[0].type).toBe('FLOODING');
    expect(res.items[0].distanceMeters).toBe(420.5);
    expect(res.meta?.total).toBe(1);
  });

  it('2. should list incidents feed with filters and sorting (GET /incidents)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [mockIncident],
          },
          meta: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const res = await incidentsService.listIncidents({
      type: 'ACCIDENT',
      severity: 'CRITICAL',
      sortBy: 'newest',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/incidents?type=ACCIDENT&severity=CRITICAL&sortBy=newest&page=1&limit=20'),
      expect.objectContaining({ method: 'GET' })
    );

    expect(res.items.length).toBe(1);
  });

  it('3. should get single incident by ID (GET /incidents/:id)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockIncident,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const incident = await incidentsService.getIncidentById('c71e21b0-449e-4e4a-b5e1-8f5bc65181a9');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/c71e21b0-449e-4e4a-b5e1-8f5bc65181a9'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock_jwt_token_for_phase3',
        }),
      })
    );

    expect(incident.id).toBe(mockIncident.id);
    expect(incident.userVote).toBe('CONFIRM');
    expect(incident.reporter?.name).toBe('Abebe Bikila');
  });

  it('4. should create new incident report (POST /incidents)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockIncident,
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const created = await incidentsService.createIncident({
      type: 'FLOODING',
      description: 'Heavy water accumulation near Gotera underpass.',
      severity: 'HIGH',
      lat: 9.0014,
      lon: 38.7512,
      occurredAt: '2026-10-27T10:30:00.000Z',
      evidenceUrl: 'https://example.com/flooding.jpg',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/incidents'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock_jwt_token_for_phase3',
        }),
        body: JSON.stringify({
          type: 'FLOODING',
          description: 'Heavy water accumulation near Gotera underpass.',
          severity: 'HIGH',
          lat: 9.0014,
          lon: 38.7512,
          occurredAt: '2026-10-27T10:30:00.000Z',
          evidenceUrl: 'https://example.com/flooding.jpg',
        }),
      })
    );

    expect(created.id).toBe(mockIncident.id);
  });

  it('5. should catch 409 DUPLICATE_REPORT and throw DuplicateIncidentError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DUPLICATE_REPORT',
            message: 'A similar incident was recently reported near this location.',
          },
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await expect(
      incidentsService.createIncident({
        type: 'FLOODING',
        description: 'Duplicate flood report.',
        lat: 9.0014,
        lon: 38.7512,
      })
    ).rejects.toThrow(DuplicateIncidentError);
  });

  it('6. should update existing incident report (PATCH /incidents/:id)', async () => {
    const updated = {
      ...mockIncident,
      description: 'Water has cleared, slow traffic remaining.',
      severity: 'LOW' as const,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: updated,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await incidentsService.updateIncident('c71e21b0-449e-4e4a-b5e1-8f5bc65181a9', {
      description: 'Water has cleared, slow traffic remaining.',
      severity: 'LOW',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/c71e21b0-449e-4e4a-b5e1-8f5bc65181a9'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          description: 'Water has cleared, slow traffic remaining.',
          severity: 'LOW',
        }),
      })
    );

    expect(result.severity).toBe('LOW');
  });

  it('7. should delete or withdraw incident (DELETE /incidents/:id)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'c71e21b0-449e-4e4a-b5e1-8f5bc65181a9',
            deleted: true,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await incidentsService.deleteIncident('c71e21b0-449e-4e4a-b5e1-8f5bc65181a9');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/c71e21b0-449e-4e4a-b5e1-8f5bc65181a9'),
      expect.objectContaining({ method: 'DELETE' })
    );

    expect(result.deleted).toBe(true);
  });

  it('8. should vote on incident (POST /incidents/:id/confirm)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'vote-123',
            vote: 'CONFIRM',
            confirmationsCount: 5,
            disputesCount: 0,
            status: 'ACTIVE',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await incidentsService.voteOnIncident('c71e21b0-449e-4e4a-b5e1-8f5bc65181a9', 'CONFIRM');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/c71e21b0-449e-4e4a-b5e1-8f5bc65181a9/confirm'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'CONFIRM' }),
      })
    );

    expect(result.confirmationsCount).toBe(5);
  });

  it('9. formatDistance helper formats meters and kilometers accurately', () => {
    expect(formatDistance(null)).toBe('');
    expect(formatDistance(undefined)).toBe('');
    expect(formatDistance(250)).toBe('250 m');
    expect(formatDistance(950)).toBe('950 m');
    expect(formatDistance(1000)).toBe('1.0 km');
    expect(formatDistance(2450)).toBe('2.5 km');
    expect(formatDistance(12800)).toBe('12.8 km');
  });
});
