import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { routesService } from '../routesService';
import * as apiClient from '../../lib/apiClient';

describe('routesService Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly maps OSRM response legs and steps into Leaflet-ready segments with [lat, lon] coordinates', async () => {
    const mockOsrmResponse = {
      provider: 'addis-transit',
      routes: [
        {
          id: 'route-driving-001',
          mode: 'driving',
          summary: 'Driving via Churchill Ave (4.2 km, ~12 min)',
          durationSeconds: 720,
          distanceMeters: 4200,
          geometry: {
            type: 'LineString',
            // OSRM provides [longitude, latitude]
            coordinates: [
              [38.7510, 9.0340],
              [38.7580, 9.0200],
              [38.7618, 9.0108],
            ],
          },
          legs: [
            {
              distanceMeters: 4200,
              durationSeconds: 720,
              steps: [
                {
                  name: 'Churchill Ave',
                  durationSeconds: 300,
                  distanceMeters: 2000,
                  maneuver: {
                    type: 'depart',
                    instruction: 'Head south on Churchill Ave',
                    location: [38.7510, 9.0340], // [lon, lat]
                  },
                },
                {
                  name: 'Ras Abebe Aregay St',
                  durationSeconds: 420,
                  distanceMeters: 2200,
                  maneuver: {
                    type: 'turn',
                    instruction: 'Turn left onto Ras Abebe Aregay St',
                    location: [38.7580, 9.0200], // [lon, lat]
                  },
                },
              ],
            },
          ],
        },
      ],
      limitations: [],
    };

    vi.spyOn(apiClient, 'request').mockResolvedValueOnce(mockOsrmResponse);

    const result = await routesService.getRoutes({
      originLat: 9.0340,
      originLon: 38.7510,
      destinationLat: 9.0108,
      destinationLon: 38.7618,
      mode: 'driving',
      language: 'en',
    });

    expect(result.routes).toHaveLength(1);
    const route = result.routes[0];
    expect(route.id).toBe('route-driving-001');
    expect(route.summary).toContain('Churchill Ave');
    expect(route.segments).toHaveLength(2);

    // Verify first step instruction and converted Leaflet coordinates [lat, lon]
    expect(route.segments[0].instruction).toBe('Head south on Churchill Ave');
    expect(route.segments[0].coordinates[0]).toEqual([9.0340, 38.7510]);

    // Verify second step instruction and converted Leaflet coordinates [lat, lon]
    expect(route.segments[1].instruction).toBe('Turn left onto Ras Abebe Aregay St');
    expect(route.segments[1].coordinates[0]).toEqual([9.0200, 38.7580]);
  });

  it('propagates API and network errors instead of silently swallowing them', async () => {
    vi.spyOn(apiClient, 'request').mockRejectedValueOnce(
      new apiClient.ApiError('OSRM router connection failed', 'PROVIDER_UNAVAILABLE', 503)
    );

    await expect(
      routesService.getRoutes({
        originLat: 9.0340,
        originLon: 38.7510,
        destinationLat: 9.0108,
        destinationLon: 38.7618,
        mode: 'driving',
      })
    ).rejects.toThrow('OSRM router connection failed');
  });

  it('safely handles empty routes or fallback data', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
      provider: 'addis-transit',
      routes: [],
      limitations: ['No direct LRT corridor within walking distance.'],
    });

    const result = await routesService.getRoutes({
      originLat: 9.00,
      originLon: 38.70,
      destinationLat: 9.15,
      destinationLon: 38.80,
      mode: 'transit',
    });

    expect(result.routes).toHaveLength(0);
    expect(result.limitations).toContain('No direct LRT corridor within walking distance.');
  });
});
