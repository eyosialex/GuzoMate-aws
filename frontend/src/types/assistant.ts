export type AssistantLanguage = 'en' | 'am' | 'om';

export interface AssistantQueryPayload {
  query: string;
  language?: AssistantLanguage;
  location?: {
    lat: number;
    lon: number;
  };
  arrivalTime?: string;
  filters?: {
    radiusMeters?: number;
    categories?: string[];
  };
  enableVoice?: boolean;
  voiceId?: string;
  userId?: string;
}

export interface AssistantVoiceData {
  provider: 'addis-ai' | string;
  voiceId: string;
  language: AssistantLanguage;
  audioUrl: string;
  audioBase64?: string;
  mimeType: string;
  durationSeconds?: number;
}

export interface AssistantPlaceItem {
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
  source?: string;
}

export interface AssistantWeatherData {
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
  arrivalAdvice?: {
    arrivalTime: string;
    suggestions: Array<{
      type: string;
      text: string;
      reason: string;
    }>;
  };
  provider?: string;
  retrievedAt?: string;
  cached?: boolean;
}

export interface AssistantIncidentItem {
  id: string;
  type: string;
  description: string;
  severity?: string;
  status?: string;
  verification?: string;
  location?: {
    lat: number;
    lon: number;
  };
  distanceMeters: number;
  createdAt?: string;
}

export interface AssistantResponse {
  answer: string;
  language: AssistantLanguage;
  intent: string;
  places: AssistantPlaceItem[];
  weather: AssistantWeatherData | null;
  incidents: AssistantIncidentItem[];
  sources?: Array<{
    type: string;
    retrievedAt: string;
  }>;
  limitations: string[];
  voice?: AssistantVoiceData | null;
}

export interface SpeechSynthesisPayload {
  text: string;
  language?: AssistantLanguage;
  voice?: string;
}

export interface SpeechSynthesisResponse {
  provider: string;
  voiceId: string;
  language: AssistantLanguage;
  audioUrl: string;
  audioBase64?: string;
  mimeType: string;
  durationSeconds: number;
}

export interface ClearMemoryPayload {
  userId?: string;
}

export interface ClearMemoryResponse {
  success: boolean;
  message: string;
  deletedTurns: number;
}
