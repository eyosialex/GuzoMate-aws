/**
 * GuzoMate Domain Types and API Contracts
 * Strictly maps to backend API Reference v2.0
 */

export type Language = 'en' | 'am' | 'om';

export type PlaceCategory = 
  | 'restaurant' 
  | 'hotel' 
  | 'hospital' 
  | 'pharmacy' 
  | 'mechanic' 
  | 'fuel' 
  | 'cafe' 
  | 'bank' 
  | 'all';

export interface GeoLocation {
  lat: number;
  lon: number;
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
  osm: {
    type: 'node' | 'way' | 'relation' | string;
    id: string;
  };
  isSaved?: boolean;
}

export interface PlacesNearbyResponse {
  items: Place[];
  nextCursor: string | null;
  attribution: string;
}

export type IncidentType =
  | 'ACCIDENT'
  | 'ROAD_CLOSURE'
  | 'FLOODING'
  | 'LANDSLIDE'
  | 'ROAD_DAMAGE'
  | 'CONSTRUCTION'
  | 'HEAVY_TRAFFIC'
  | 'OTHER';

export type IncidentStatus = 
  | 'PENDING' 
  | 'ACTIVE' 
  | 'RESOLVED' 
  | 'REJECTED' 
  | 'EXPIRED';

export type IncidentVerification = 
  | 'UNVERIFIED' 
  | 'COMMUNITY_CONFIRMED' 
  | 'OFFICIALLY_VERIFIED';

export interface Incident {
  id: string;
  title?: string;
  type: IncidentType;
  description: string;
  status: IncidentStatus;
  verification: IncidentVerification;
  location: GeoLocation;
  locationName?: string;
  distanceMeters?: number | null;
  createdAt: string;
  expiresAt?: string | null;
  occurredAt?: string;
  confirmationsCount?: number;
}

export interface IncidentSubmissionPayload {
  title?: string;
  type: IncidentType;
  description: string;
  location: GeoLocation;
  locationName?: string;
  occurredAt?: string;
}

export interface IncidentNearbyResponse {
  items: Incident[];
  nextCursor: string | null;
}

export type RouteTravelMode = 'transit' | 'driving' | 'walking';

export interface RouteSegment {
  id: string;
  instruction: string;
  mode: RouteTravelMode | string;
  distanceMeters: number;
  durationSeconds: number;
  fromStop?: string;
  toStop?: string;
  lineName?: string;
  coordinates: [number, number][]; // [lat, lon]
}

export interface RouteOption {
  id: string;
  provider: string;
  mode: RouteTravelMode;
  durationSeconds: number | null;
  distanceMeters: number | null;
  summary: string;
  segments: RouteSegment[];
  sourceUpdatedAt: string | null;
  limitations?: string[];
}

export interface RoutesResponse {
  provider: string;
  routes: RouteOption[];
  limitations?: string[];
}

export interface CurrentWeather {
  temperatureC: number;
  condition: string;
  precipitationMm: number | null;
  windKph: number | null;
  humidity?: number;
}

export interface HourlyForecast {
  time: string;
  temperatureC: number;
  condition: string;
  precipitationProbability: number;
}

export interface DailyForecast {
  date: string;
  hourly: HourlyForecast[];
}

export interface WeatherAdviceItem {
  type: 'accessory' | 'clothing' | 'route' | 'warning' | string;
  text: string;
  reason: string;
}

export interface ArrivalAdvice {
  arrivalTime: string;
  forecast: {
    temperatureC: number;
    condition: string;
    precipitationProbability: number;
  };
  suggestions: WeatherAdviceItem[];
  language?: string;
  provider?: string;
  retrievedAt?: string;
}

export interface WeatherData {
  location: GeoLocation;
  current: CurrentWeather;
  forecast: DailyForecast[];
  arrivalAdvice?: ArrivalAdvice | null;
  provider: string;
  retrievedAt: string;
  cached: boolean;
}

export interface AssistantSource {
  type: string;
  retrievedAt: string;
}

export interface AssistantQueryPayload {
  query: string;
  language: Language;
  location: GeoLocation;
  arrivalTime?: string;
  filters?: {
    radiusMeters?: number;
    categories?: string[];
  };
}

export interface AssistantQueryResponse {
  answer: string;
  language: Language;
  intent: string;
  places?: Place[];
  weather?: WeatherData | null;
  incidents?: Incident[];
  routes?: RouteOption[];
  sources?: AssistantSource[];
  limitations?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language?: Language;
  places?: Place[];
  weather?: WeatherData | null;
  incidents?: Incident[];
  routes?: RouteOption[];
  sources?: AssistantSource[];
  isStreaming?: boolean;
  audioUrl?: string;
  audioDurationSeconds?: number;
}

export interface UserPreferences {
  preferredLanguage: Language;
  units: 'metric' | 'imperial';
}

export type ActiveTab = 'assistant' | 'places' | 'routes' | 'weather' | 'incidents';

export type PageView = 'landing' | 'app' | 'about' | 'contact' | 'home' | 'explore' | 'incidents';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferredLanguage: Language;
  isGuildVerified?: boolean;
  avatarUrl?: string;
}
