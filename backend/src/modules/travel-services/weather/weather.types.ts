export type SupportedLanguage = 'en' | 'am' | 'om';

export interface WeatherLocation {
  lat: number;
  lon: number;
}

export interface WeatherCurrentConditions {
  temperatureC: number;
  condition: string;
  precipitationMm: number | null;
  windKph: number | null;
  humidity?: number | null;
}

export interface WeatherHourlyItem {
  time: string;
  temperatureC: number;
  condition: string;
  precipitationProbability: number;
}

export interface WeatherForecastDayItem {
  date: string;
  hourly: WeatherHourlyItem[];
}

export interface WeatherSuggestion {
  type: 'accessory' | 'clothing' | 'sun_protection' | 'caution';
  text: string;
  reason: string;
}

export interface WeatherArrivalAdvice {
  arrivalTime: string;
  forecast: {
    temperatureC: number;
    condition: string;
    precipitationProbability: number;
  };
  suggestions: WeatherSuggestion[];
  language: SupportedLanguage;
  provider: string;
  retrievedAt: string;
  cached?: boolean;
}

export interface CurrentWeatherResponse {
  location: WeatherLocation;
  current: WeatherCurrentConditions;
  provider: string;
  retrievedAt: string;
  cached: boolean;
}

export interface ForecastWeatherResponse {
  location: WeatherLocation;
  forecast: WeatherForecastDayItem[];
  provider: string;
  retrievedAt: string;
  cached: boolean;
}

export interface NormalizedWeatherData {
  location: WeatherLocation;
  current: WeatherCurrentConditions;
  forecast: WeatherForecastDayItem[];
  provider: string;
  retrievedAt: string;
}
