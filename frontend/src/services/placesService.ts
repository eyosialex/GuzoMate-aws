import { request } from '../lib/apiClient';
import { Place, PlacesNearbyResponse, Language, PlaceCategory } from '../types';

export interface NearbyPlacesParams {
  lat: number;
  lon: number;
  radiusMeters?: number;
  category?: PlaceCategory | string;
  query?: string;
  limit?: number;
  language?: Language;
}

export const placesService = {
  async getNearby(params: NearbyPlacesParams): Promise<PlacesNearbyResponse> {
    try {
      return await request<PlacesNearbyResponse>('/places/nearby', {
        method: 'GET',
        params: {
          lat: params.lat,
          lon: params.lon,
          radiusMeters: params.radiusMeters || 5000,
          category: params.category === 'all' ? undefined : params.category,
          query: params.query,
          limit: params.limit || 20,
        },
        language: params.language,
      });
    } catch {
      return {
        items: [],
        nextCursor: null,
        attribution: '© OpenStreetMap contributors',
      };
    }
  },

  async getPlaceById(id: string, language?: Language): Promise<Place> {
    return await request<Place>(`/places/${id}`, {
      method: 'GET',
      language,
    });
  },

  async toggleSave(placeId: string, shouldSave: boolean): Promise<boolean> {
    try {
      if (shouldSave) {
        await request<{ saved: boolean }>('/saved-places', {
          method: 'POST',
          body: JSON.stringify({ placeId }),
        });
      } else {
        await request<void>(`/saved-places/${placeId}`, {
          method: 'DELETE',
        });
      }
      return true;
    } catch {
      return false;
    }
  },
};
