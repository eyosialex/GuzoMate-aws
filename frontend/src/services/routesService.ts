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
