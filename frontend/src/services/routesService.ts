import { request } from '../lib/apiClient';
import { Language } from '../types';
import {
  RoutesResponseData,
  RouteMode,
} from '../types/travelServices';

export interface RouteSearchParams {
  originLat: number;
  originLon: number;
  destinationLat?: number;
  destLat?: number;
  destinationLon?: number;
  destLon?: number;
  mode?: RouteMode;
  departAt?: string;
  language?: Language;
  includeIncidents?: boolean;
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
  /**
   * Calculates multimodal routes (driving, walking, transit) with live incident intersection alerts.
   * GET /api/v1/routes
   */
  async getRoutes(params: RouteSearchParams): Promise<RoutesResponseData & { routes: any[] }> {
    const destLat = params.destinationLat ?? params.destLat ?? 0;
    const destLon = params.destinationLon ?? params.destLon ?? 0;

    try {
      const res = await request<RoutesResponseData>('/routes', {
        method: 'GET',
        params: {
          originLat: params.originLat,
          originLon: params.originLon,
          destLat,
          destLon,
          mode: params.mode || 'driving',
          language: params.language || 'en',
          includeIncidents: params.includeIncidents ?? true,
        },
        language: params.language,
      });

      return {
        provider: res?.provider || 'guzomate-routing',
        origin: res?.origin || { lat: params.originLat, lon: params.originLon },
        destination: res?.destination || { lat: destLat, lon: destLon },
        mode: res?.mode || params.mode || 'driving',
        routes: res?.routes || [],
        transitStatus: res?.transitStatus || {
          liveTrackingAvailable: false,
          notice: 'Transit schedules based on standard routes.',
          coveredOperators: ['Minibus Taxi', 'Anbessa City Bus', 'Sheger Express', 'Addis Light Rail'],
        },
        limitations: res?.limitations || [],
        retrievedAt: res?.retrievedAt || new Date().toISOString(),
      };
    } catch {
      return {
        provider: 'guzomate-routing',
        origin: { lat: params.originLat, lon: params.originLon },
        destination: { lat: destLat, lon: destLon },
        mode: params.mode || 'driving',
        routes: [],
        transitStatus: {
          liveTrackingAvailable: false,
          notice: 'Routing service temporarily unavailable.',
          coveredOperators: [],
        },
        limitations: ['Unable to calculate routes right now.'],
      };
    }
  },
};
