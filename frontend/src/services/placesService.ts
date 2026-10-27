import { request } from '../lib/apiClient';
import { Place, PlacesNearbyResponse, Language } from '../types';
import {
  NearbyPlacesParams,
  SavedPlacesResponse,
  SavePlaceResponse,
} from '../types/places';

export type { NearbyPlacesParams };

export const placesService = {
  /**
   * Queries nearby points-of-interest from 13,800+ OpenStreetMap curated Addis points.
   * GET /api/v1/places/nearby
   */
  async getNearby(params: NearbyPlacesParams): Promise<PlacesNearbyResponse> {
    try {
      const res = await request<PlacesNearbyResponse>('/places/nearby', {
        method: 'GET',
        params: {
          lat: params.lat,
          lon: params.lon,
          radiusMeters: params.radiusMeters || 5000,
          category: params.category === 'all' ? undefined : params.category,
          query: params.query?.trim() || undefined,
          limit: params.limit || 20,
        },
      });

      return {
        items: res?.items || [],
        nextCursor: res?.nextCursor ?? null,
        attribution: res?.attribution || '© OpenStreetMap contributors',
      };
    } catch {
      return {
        items: [],
        nextCursor: null,
        attribution: '© OpenStreetMap contributors',
      };
    }
  },

  /**
   * Retrieves single place details by ID.
   * GET /api/v1/places/:id
   */
  async getPlaceById(id: string, language?: Language): Promise<Place> {
    return await request<Place>(`/places/${id}`, {
      method: 'GET',
      language,
    });
  },

  /**
   * Lists bookmarked places for the authenticated traveler.
   * GET /api/v1/saved-places
   */
  async getSavedPlaces(): Promise<SavedPlacesResponse> {
    const res = await request<SavedPlacesResponse>('/saved-places', {
      method: 'GET',
    });

    return {
      items: res?.items || [],
      total: res?.total ?? (res?.items ? res.items.length : 0),
    };
  },

  /**
   * Bookmarks a place for the authenticated traveler.
   * POST /api/v1/saved-places
   */
  async savePlace(placeId: string): Promise<SavePlaceResponse> {
    return await request<SavePlaceResponse>('/saved-places', {
      method: 'POST',
      body: JSON.stringify({ placeId }),
    });
  },

  /**
   * Removes a place from traveler's bookmarks.
   * DELETE /api/v1/saved-places/:placeId
   */
  async deleteSavedPlace(placeId: string): Promise<boolean> {
    await request<void>(`/saved-places/${encodeURIComponent(placeId)}`, {
      method: 'DELETE',
    });
    return true;
  },

  /**
   * Toggles saved bookmark state.
   */
  async toggleSave(placeId: string, shouldSave: boolean): Promise<boolean> {
    try {
      if (shouldSave) {
        await this.savePlace(placeId);
      } else {
        await this.deleteSavedPlace(placeId);
      }
      return true;
    } catch {
      return false;
    }
  },
};
