import { request } from '../lib/apiClient';
import { RoutesResponse, RouteTravelMode, Language, RouteOption, RouteSegment } from '../types';

export interface RouteSearchParams {
  originLat: number;
  originLon: number;
  destinationLat: number;
  destinationLon: number;
  mode?: RouteTravelMode;
  departAt?: string;
  language?: Language;
}

/**
 * Normalizes backend OSRM / Addis Transit route responses:
 * - Flips GeoJSON [lon, lat] coordinates to Leaflet [lat, lon]
 * - Converts legs and steps into frontend RouteSegment items
 */
function normalizeRouteOption(raw: any, mode: RouteTravelMode): RouteOption {
  // Extract and flip polyline coordinates if provided as GeoJSON LineString [lon, lat]
  let geometryCoords: [number, number][] = [];
  if (raw.geometry?.coordinates && Array.isArray(raw.geometry.coordinates)) {
    geometryCoords = raw.geometry.coordinates.map((c: any) => {
      // Leaflet requires [latitude, longitude]
      return [Number(c[1]), Number(c[0])] as [number, number];
    });
  }

  // Build segments from legs & steps if segments is not already an array
  let segments: RouteSegment[] = [];
  if (Array.isArray(raw.segments) && raw.segments.length > 0) {
    segments = raw.segments.map((seg: any, idx: number) => ({
      id: seg.id || `${raw.id}-seg-${idx}`,
      instruction: seg.instruction || 'Continue on route',
      mode: seg.mode || mode,
      distanceMeters: Number(seg.distanceMeters) || 0,
      durationSeconds: Number(seg.durationSeconds) || 0,
      lineName: seg.lineName,
      coordinates: Array.isArray(seg.coordinates) && seg.coordinates.length > 0
        ? seg.coordinates
        : geometryCoords,
    }));
  } else if (Array.isArray(raw.legs) && raw.legs.length > 0) {
    for (let legIdx = 0; legIdx < raw.legs.length; legIdx++) {
      const leg = raw.legs[legIdx];
      const steps = leg.steps || [];
      for (let stepIdx = 0; stepIdx < steps.length; stepIdx++) {
        const step = steps[stepIdx];
        const maneuver = step.maneuver;
        const coords: [number, number][] = [];
        if (maneuver?.location && Array.isArray(maneuver.location)) {
          // OSRM maneuver location is [lon, lat] -> convert to Leaflet [lat, lon]
          coords.push([Number(maneuver.location[1]), Number(maneuver.location[0])]);
        }
        segments.push({
          id: `${raw.id}-seg-${legIdx}-${stepIdx}`,
          instruction: maneuver?.instruction || step.name || 'Proceed along path',
          mode: mode,
          distanceMeters: Number(step.distanceMeters) || 0,
          durationSeconds: Number(step.durationSeconds) || 0,
          lineName: step.name && step.name !== 'Road' && step.name !== 'Pedestrian Path' ? step.name : undefined,
          coordinates: coords.length > 0 ? coords : geometryCoords,
        });
      }
    }
  }

  // Fallback if no segments could be parsed: create at least one single segment
  if (segments.length === 0) {
    segments.push({
      id: `${raw.id}-seg-fallback`,
      instruction: raw.summary || 'Proceed along route',
      mode: mode,
      distanceMeters: Number(raw.distanceMeters) || 0,
      durationSeconds: Number(raw.durationSeconds) || 0,
      coordinates: geometryCoords,
    });
  }

  return {
    id: raw.id || `route-${Date.now()}`,
    provider: raw.provider || raw.source || 'addis-transit',
    mode: (raw.mode as RouteTravelMode) || mode,
    durationSeconds: raw.durationSeconds != null ? Number(raw.durationSeconds) : null,
    distanceMeters: raw.distanceMeters != null ? Number(raw.distanceMeters) : null,
    summary: raw.summary || 'Route calculated',
    segments,
    sourceUpdatedAt: raw.sourceUpdatedAt || new Date().toISOString(),
    limitations: Array.isArray(raw.limitations) ? raw.limitations : undefined,
  };
}

export const routesService = {
  async getRoutes(params: RouteSearchParams): Promise<RoutesResponse> {
    const rawResponse = await request<any>('/routes', {
      method: 'GET',
      params: {
        originLat: params.originLat,
        originLon: params.originLon,
        destLat: params.destinationLat,
        destLon: params.destinationLon,
        mode: params.mode || 'transit',
        language: params.language || 'en',
        includeIncidents: true,
      },
      language: params.language,
    });

    const mode = params.mode || 'transit';
    const rawRoutes: any[] = Array.isArray(rawResponse?.routes)
      ? rawResponse.routes
      : Array.isArray(rawResponse?.data?.routes)
      ? rawResponse.data.routes
      : [];

    const normalizedRoutes: RouteOption[] = rawRoutes.map((r) => normalizeRouteOption(r, mode));

    return {
      provider: rawResponse?.provider || rawResponse?.data?.provider || 'addis-transit',
      routes: normalizedRoutes,
      limitations: rawResponse?.limitations || rawResponse?.data?.limitations || [],
    };
  },
};
