export interface WeatherForecastDto {
  temperatureC: number;
  condition: string;
  precipitationMm?: number;
  windSpeedKmh?: number;
}

export interface RouteOptionDto {
  id: string;
  name: string;
  mode: 'bus' | 'lrt' | 'minibus' | 'walking';
  durationMinutes: number;
  distanceMeters: number;
}

export interface SpeechSynthesisDto {
  audioUrl?: string;
  audioBase64?: string;
  mimeType: string;
}
