export type SupportedLanguage = 'en' | 'am' | 'om';

export interface AssistantQueryRequest {
  query: string;
  language?: SupportedLanguage;
  location?: { lat: number; lon: number };
  arrivalTime?: string;
  userId?: string;
  enableVoice?: boolean;
}

export interface AssistantQueryResponse {
  answer: string;
  language: SupportedLanguage;
  intents: string[];
  places: Array<{
    name: string;
    category?: string;
    distanceMeters: number;
    lat: number;
    lon: number;
  }>;
  weather?: any;
  speech?: {
    audioUrl?: string;
    audioBase64?: string;
    mimeType: string;
  } | null;
}
