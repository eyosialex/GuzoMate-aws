// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { routesService } from '../routesService';
import { RoutesResponseData, RouteOption } from '../../types/travelServices';

describe('Routing & Transit Services Module Integration (Phase 9)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockRoute: RouteOption = {
    id: 'route_driving_1',
    mode: 'driving',
    summary: 'Via Debre Zeit Rd / Bole Rd',
    durationSeconds: 1380,
    durationMinutes: 23,
    distanceMeters: 7450,
    fareEtb: null,
    legs: [
      {
        distanceMeters: 7450,
        durationSeconds: 1380,
        steps: [
          {
            name: 'Ras Mekonnen Ave',
            distanceMeters: 1200,
            durationSeconds: 180,
            maneuver: {
              type: 'turn',
              modifier: 'right',
              instruction: 'Turn right onto Ras Mekonnen Ave',
              location: [38.745, 9.028],
            },
          },
        ],
      },
    ],
    incidentAlerts: [
      {
        incidentId: 'c71e21b0-449e-4e4a-b5e1-8f5bc65181a9',
        type: 'CONSTRUCTION',
        description: 'Right lane closed near Meskel Square.',
        severity: 'MEDIUM',
        location: { lat: 9.012, lon: 38.762 },
        distanceMeters: 45.0,
      },
    ],
    source: 'osrm',
    isLiveSchedule: false,
  };

  it('1. should calculate multimodal routes with incident intersection warnings (GET /routes)', async () => {
    const mockRoutesResponse: RoutesResponseData = {
      provider: 'guzomate-routing',
      origin: { lat: 9.03, lon: 38.74 },
      destination: { lat: 8.995, lon: 38.784 },
      mode: 'driving',
      routes: [mockRoute],
      transitStatus: {
        liveTrackingAvailable: false,
        notice: 'Minibus and Anbessa Bus schedules based on typical headway.',
        coveredOperators: ['Minibus Taxi', 'Anbessa City Bus', 'Sheger Express', 'Addis Light Rail'],
      },
      limitations: [],
      retrievedAt: '2026-10-27T10:45:00.000Z',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockRoutesResponse,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await routesService.getRoutes({
      originLat: 9.03,
      originLon: 38.74,
      destinationLat: 8.995,
      destinationLon: 38.784,
      mode: 'driving',
      language: 'en',
      includeIncidents: true,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('/routes?originLat=9.03&originLon=38.74&destLat=8.995&destLon=38.784&mode=driving');
    expect(result.routes.length).toBe(1);
    expect(result.routes[0].durationMinutes).toBe(23);
    expect(result.routes[0].incidentAlerts?.length).toBe(1);
    expect(result.routes[0].incidentAlerts![0].type).toBe('CONSTRUCTION');
    expect(result.transitStatus.coveredOperators).toContain('Addis Light Rail');
  });

  it('2. should return safe fallback structure when routing provider fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('OSRM network timeout'));

    const result = await routesService.getRoutes({
      originLat: 9.03,
      originLon: 38.74,
      destLat: 8.995,
      destLon: 38.784,
    });

    expect(result.provider).toBe('guzomate-routing');
    expect(result.routes).toEqual([]);
    expect(result.limitations?.length).toBeGreaterThan(0);
  });
});
