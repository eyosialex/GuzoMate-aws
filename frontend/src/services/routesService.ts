import { request } from '../lib/apiClient';
import { RoutesResponse, RouteOption, RouteTravelMode, Language } from '../types';
import { MOCK_ROUTES } from '../lib/mockData';

const isMockForced = import.meta.env.VITE_USE_MOCK_DATA === 'true';

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
    if (!isMockForced) {
      try {
        return await request<RoutesResponse>('/routes', {
          method: 'GET',
          params: {
            originLat: params.originLat,
            originLon: params.originLon,
            destinationLat: params.destinationLat,
            destinationLon: params.destinationLon,
            mode: params.mode,
            departAt: params.departAt,
          },
          language: params.language,
        });
      } catch (error) {
        console.warn('Backend routing unavailable, using Addis Transit mock routes:', error);
      }
    }

    let routes: RouteOption[] = [...MOCK_ROUTES];
    if (params.mode) {
      routes = routes.filter((r) => r.mode === params.mode);
      if (routes.length === 0) routes = [...MOCK_ROUTES];
    }
    return {
      provider: 'addis-transit',
      routes,
      limitations: ['Estimated transit timings based on typical schedule'],
    };
  },
};
