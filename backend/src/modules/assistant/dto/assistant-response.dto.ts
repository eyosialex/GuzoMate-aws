import { SupportedLanguage } from './assistant-query.dto.js';

export interface PlaceResultItem {
  id: string;
  name: string | null;
  category: string;
  location: {
    lat: number;
    lon: number;
  };
  distanceMeters: number;
  address: string | null;
  tags: Record<string, any>;
  source: 'openstreetmap';
  osm: {
    type: string;
    id: string;
  };
}

export interface WeatherHourlyForecast {
  time: string;
  temperatureC: number;
  condition: string;
  precipitationProbability: number;
}

export interface WeatherForecastDay {
  date: string;
  hourly: WeatherHourlyForecast[];
}

export interface WeatherSuggestion {
  type: string;
  text: string;
  reason: string;
}

export interface WeatherResultItem {
  location: {
    lat: number;
    lon: number;
  };
  current?: {
    temperatureC: number;
    condition: string;
    precipitationMm: number | null;
    windKph: number | null;
  };
  forecast?: WeatherForecastDay[];
  arrivalAdvice?: {
    arrivalTime: string;
    suggestions: WeatherSuggestion[];
  };
  provider: 'weatherapi';
  retrievedAt: string;
  cached?: boolean;
}

export interface IncidentResultItem {
  id: string;
  type: string;
  description: string;
  status: 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'REJECTED' | 'EXPIRED';
  verification: 'UNVERIFIED' | 'COMMUNITY_CONFIRMED' | 'OFFICIAL';
  location: {
    lat: number;
    lon: number;
  };
  distanceMeters: number;
  createdAt: string;
  expiresAt?: string | null;
}

export interface SourceItem {
  type: 'openstreetmap' | 'weatherapi' | 'addis-transit' | 'rag_knowledge' | 'incident_reports';
  retrievedAt: string;
}

export interface AddisVoiceResult {
  provider: 'addis-ai';
  voiceId: string;
  language: SupportedLanguage;
  audioUrl: string;
  audioBase64?: string;
  mimeType: string;
  durationSeconds?: number;
}

export interface AssistantQueryResponse {
  answer: string;
  language: SupportedLanguage;
  intent: string;
  places: PlaceResultItem[];
  weather: WeatherResultItem | null;
  incidents: IncidentResultItem[];
  sources: SourceItem[];
  limitations: string[];
  voice?: AddisVoiceResult | null;
}
