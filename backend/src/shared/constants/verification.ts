import { IncidentType } from '@prisma/client';

export const VERIFICATION_THRESHOLDS = {
  CONFIRMATIONS_TO_ACTIVATE: 3,
  DISPUTES_FOR_REVIEW: 3,
  DUPLICATE_RADIUS_METERS: 500,
  DUPLICATE_TIME_WINDOW_MS: 2 * 60 * 60 * 1000, // 2 hours
  DEFAULT_NEARBY_RADIUS_METERS: 5000,
  MAX_NEARBY_RADIUS_METERS: 50000,
} as const;

export const INCIDENT_EXPIRY_HOURS: Record<IncidentType, number> = {
  ACCIDENT: 4,
  ROAD_BLOCK: 12,
  ROAD_CLOSURE: 12,
  FLOODING: 8,
  HEAVY_TRAFFIC: 2,
  CONSTRUCTION: 72,
  HAZARD: 24,
  LANDSLIDE: 24,
  ROAD_DAMAGE: 48,
  OTHER: 24,
};

export function getIncidentExpirationDate(type: IncidentType, occurredAt = new Date()): Date {
  const hours = INCIDENT_EXPIRY_HOURS[type] || 24;
  return new Date(occurredAt.getTime() + hours * 60 * 60 * 1000);
}
