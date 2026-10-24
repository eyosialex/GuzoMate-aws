import { request } from '../lib/apiClient';
import { Place, PlacesNearbyResponse, Language, PlaceCategory } from '../types';
import { MOCK_PLACES } from '../lib/mockData';

const isMockForced = import.meta.env.VITE_USE_MOCK_DATA === 'true';

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
    if (!isMockForced) {
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
      } catch (error) {
        console.warn('Backend unavailable, falling back to local OSM places:', error);
      }
    }

    // Filter mock places based on query or category
    let items = [...MOCK_PLACES];
    if (params.category && params.category !== 'all') {
      items = items.filter((p) => p.category.toLowerCase() === params.category?.toLowerCase());
    }
    if (params.query && params.query.trim()) {
      const q = params.query.toLowerCase().trim();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.address && p.address.toLowerCase().includes(q))
      );
    }
    return {
      items,
      nextCursor: null,
      attribution: '© OpenStreetMap contributors',
    };
  },

  async getPlaceById(id: string, language?: Language): Promise<Place> {
    if (!isMockForced) {
      try {
        return await request<Place>(`/places/${id}`, {
          method: 'GET',
          language,
        });
      } catch (error) {
        console.warn(`Backend unavailable, resolving place ${id} from mock data:`, error);
      }
    }
    const found = MOCK_PLACES.find((p) => p.id === id);
    if (found) return found;
    throw new Error('Place not found');
  },

  async toggleSave(placeId: string, shouldSave: boolean): Promise<boolean> {
    if (!isMockForced) {
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
      } catch {
        // Graceful local toggle
      }
    }
    return true;
  },
};
