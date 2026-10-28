export type RoutingMode = 'driving' | 'walking' | 'transit' | 'all';

export interface RouteCoordinates {
  lat: number;
  lon: number;
}

export interface RouteManeuver {
  type: string;
  modifier?: string;
  instruction: string;
  location: [number, number]; // [lon, lat]
}

export interface RouteStep {
  name: string;
  durationSeconds: number;
  distanceMeters: number;
  maneuver: RouteManeuver;
}

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
  summary?: string;
  steps: RouteStep[];
}

export interface RouteIncidentAlert {
  incidentId: string;
  type: string;
  description: string;
  severity: string | null;
  location: RouteCoordinates;
  distanceMeters: number;
}

export interface RouteOption {
  id: string;
  mode: 'driving' | 'walking' | 'transit';
  summary: string;
  durationSeconds: number | null;
  durationMinutes: number | null;
  distanceMeters: number | null;
  fareEtb?: number | null;
  fareExplanation?: string;
  geometry?: string | any; // GeoJSON or polyline
  legs: RouteLeg[];
  segments?: any[];
  transitStops?: string[];
  transfersCount?: number;
  source: 'osrm' | 'addis-transit-static' | 'addis-transit';
  sourceUpdatedAt: string | null;
  isLiveSchedule: boolean;
  incidentAlerts?: RouteIncidentAlert[];
}

export interface TransitFeedStatus {
  liveTrackingAvailable: boolean;
  gtfsRealtimeAvailable: boolean;
  notice: string;
  coveredOperators: string[];
}

export interface RoutesResponse {
  provider: string;
  origin: RouteCoordinates;
  destination: RouteCoordinates;
  mode: RoutingMode;
  routes: RouteOption[];
  transitStatus: TransitFeedStatus;
  limitations: string[];
  retrievedAt: string;
}
