export interface PlaceDto {
  id: string;
  name: string;
  category: string;
  address?: string;
  lat: number;
  lon: number;
  distanceMeters?: number;
}
