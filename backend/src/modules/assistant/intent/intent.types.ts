import { SupportedLanguage } from '../dto/assistant-query.dto.js';

export type IntentType =
  | 'nearby_places'
  | 'weather'
  | 'routes'
  | 'incidents'
  | 'travel_advice'
  | 'mixed';

export interface ParsedIntent {
  primaryIntent: IntentType;
  intents: IntentType[];
  language: SupportedLanguage;
  categories: string[];
  locationKeyword?: string;
  arrivalTime?: string;
  radiusMeters?: number;
  needsPlaces: boolean;
  needsWeather: boolean;
  needsIncidents: boolean;
  needsRoutes: boolean;
  needsKnowledge: boolean;
}
