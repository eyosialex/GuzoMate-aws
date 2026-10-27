import { request } from '../lib/apiClient';
import { RoutesResponse, RouteTravelMode, Language } from '../types';

export interface RouteSearchParams {
  originLat: number;
  originLon: number;
  destinationLat: number;
  destinationLon: number;
  mode?: RouteTravelMode;
  departAt?: string;
  language?: Language;
}

export const routesService = {
  async getRoutes(params: RouteSearchParams): Promise<RoutesResponse> {
    try {
      return await request<RoutesResponse>('/routes', {
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
    } catch {
      return {
        provider: 'addis-transit',
        routes: [],
        limitations: [],
      };
    }
  },
};
