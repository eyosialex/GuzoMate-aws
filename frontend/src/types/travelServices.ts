export type TravelLanguage = 'en' | 'am' | 'om';
export type RouteMode = 'driving' | 'walking' | 'transit' | 'all';

export interface WeatherLocation {
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  location: WeatherLocation;
  temperatureC: number;
  condition: string;
  conditionCode: string;
  humidityPercent: number;
  precipitationMm: number;
  windKph: number;
  feelsLikeC: number;
  isDay: boolean;
  language: TravelLanguage;
  provider: string;
  retrievedAt: string;
  cached: boolean;
}

export interface HourlyForecast {
  time: string;
  temperatureC: number;
  condition: string;
  precipitationProbability: number;
}

export interface DailyForecast {
  date: string;
  maxTempC: number;
  minTempC: number;
  avgTempC: number;
  condition: string;
  hourly?: HourlyForecast[];
}

export interface WeatherForecastResponse {
  location: WeatherLocation;
  forecast: DailyForecast[];
  provider: string;
  retrievedAt: string;
}

export interface ArrivalAdviceSuggestion {
  type: 'umbrella' | 'clothing' | 'warning' | string;
  text: string;
  reason: string;
}

export interface ArrivalAdviceData {
  location: WeatherLocation;
  arrivalTime: string;
  forecastAtArrival: {
    temperatureC: number;
    condition: string;
    precipitationProbability: number;
  };
  suggestions: ArrivalAdviceSuggestion[];
}

export interface RouteManeuver {
  type: string;
  modifier?: string;
  instruction: string;
  location: [number, number];
}

export interface RouteStep {
  name: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuver: RouteManeuver;
}

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteStep[];
}

export interface RouteIncidentAlert {
  incidentId: string;
  type: string;
  description: string;
  severity: string | null;
  location: {
    lat: number;
    lon: number;
  };
  distanceMeters: number;
}

export interface RouteOption {
  id: string;
  mode: 'driving' | 'walking' | 'transit';
  summary: string;
  durationSeconds: number;
  durationMinutes: number;
  distanceMeters: number;
  fareEtb?: number | null;
  fareExplanation?: string;
  legs: RouteLeg[];
  incidentAlerts?: RouteIncidentAlert[];
  source?: string;
  isLiveSchedule?: boolean;
}

export interface TransitStatus {
  liveTrackingAvailable: boolean;
  gtfsRealtimeAvailable?: boolean;
  notice: string;
  coveredOperators: string[];
}

export interface RoutesResponseData {
  provider: string;
  origin: WeatherLocation;
  destination: WeatherLocation;
  mode: RouteMode;
  routes: RouteOption[];
  transitStatus: TransitStatus;
  limitations?: string[];
  retrievedAt?: string;
}

export interface SpeechTranscriptionPayload {
  audio: string; // Base64 or URL
  format?: 'wav' | 'mp3' | 'webm' | 'ogg' | 'm4a';
  mimeType?: string;
  language?: TravelLanguage;
}

export interface SpeechTranscriptionResult {
  text: string;
  language: TravelLanguage;
  detectedLanguage?: string;
  confidence?: number;
  provider: string;
}

export interface SpeechSynthesisPayload {
  text: string;
  language?: TravelLanguage;
  voiceId?: string;
}

export interface SpeechSynthesisData {
  provider: string;
  voiceId: string;
  language: TravelLanguage;
  audioUrl?: string | null;
  audioBase64?: string | null;
  mimeType: string;
  durationSeconds?: number | null;
}
