import { GeoLocation, PlaceCategory, Language } from './index';

export interface PlaceOsmInfo {
  type: string;
  id: string;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory | string;
  location: GeoLocation;
  distanceMeters: number | null;
  address: string | null;
  tags: Record<string, string>;
  source: string;
  osm: PlaceOsmInfo;
  isSaved?: boolean;
}

export interface SavedPlaceItem {
  id: string; // placeId
  savedId: string; // bookmark record UUID
  name: string;
  category: string;
  address: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface NearbyPlacesParams {
  lat: number;
  lon: number;
  radiusMeters?: number;
  category?: PlaceCategory | string;
  query?: string;
  limit?: number;
  language?: Language;
}

export interface NearbyPlacesResponse {
  items: Place[];
  count: number;
  nextCursor: string | null;
  attribution: string;
}

export interface SavedPlacesResponse {
  items: SavedPlaceItem[];
  total: number;
}

export interface SavePlaceResponse {
  placeId: string;
  saved: boolean;
  createdAt: string;
}
