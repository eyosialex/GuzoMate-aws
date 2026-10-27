export type IncidentType =
  | 'ACCIDENT'
  | 'ROAD_BLOCK'
  | 'ROAD_CLOSURE'
  | 'FLOODING'
  | 'LANDSLIDE'
  | 'ROAD_DAMAGE'
  | 'CONSTRUCTION'
  | 'HEAVY_TRAFFIC'
  | 'HAZARD'
  | 'OTHER';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'REJECTED' | 'EXPIRED';
export type VerificationStatus = 'UNVERIFIED' | 'COMMUNITY_CONFIRMED' | 'MODERATOR_VERIFIED';

export interface IncidentLocation {
  lat: number;
  lon: number;
}

export interface IncidentReporter {
  id: string;
  name: string | null;
}

export interface Incident {
  id: string;
  type: IncidentType;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  verification: VerificationStatus;
  location: IncidentLocation;
  distanceMeters?: number;
  confirmationsCount: number;
  disputesCount: number;
  occurredAt?: string;
  expiresAt?: string;
  evidenceUrl?: string | null;
  reporter?: IncidentReporter;
  userVote?: 'CONFIRM' | 'DISPUTE' | null;
  createdAt: string;
  updatedAt: string;

  // Legacy/UI display helper aliases
  title?: string;
  locationName?: string;
}

export interface CreateIncidentPayload {
  type: IncidentType;
  description: string;
  severity?: IncidentSeverity;
  lat: number;
  lon: number;
  occurredAt?: string;
  evidenceUrl?: string;
}

export interface UpdateIncidentPayload {
  description?: string;
  severity?: IncidentSeverity;
  evidenceUrl?: string | null;
}

export interface NearbyIncidentsParams {
  lat: number;
  lon: number;
  radius?: number; // 100 to 50000 meters, default 5000
  radiusMeters?: number; // alias for radius
  type?: IncidentType;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  page?: number;
  limit?: number;
}

export interface ListIncidentsQuery {
  type?: IncidentType;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: 'newest' | 'oldest' | 'severity';
  page?: number;
  limit?: number;
}

export interface PaginatedIncidentsResponse {
  items: Incident[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const SEVERITY_COLORS: Record<IncidentSeverity, { bg: string; text: string; border: string; hex: string }> = {
  LOW: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', hex: '#10B981' },
  MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', hex: '#F59E0B' },
  HIGH: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hex: '#EA580C' },
  CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', hex: '#DC2626' },
};

export const INCIDENT_TYPE_LABELS: Record<IncidentType, { en: string; am: string; om: string }> = {
  ACCIDENT: { en: 'Traffic Accident', am: 'የትራፊክ አደጋ', om: 'Balaa Tiraafikaa' },
  ROAD_BLOCK: { en: 'Road Blockage / Escarpment', am: 'መንገድ መዘጋት / ጋሬጣ', om: 'Daandii Cufame' },
  ROAD_CLOSURE: { en: 'Complete Road Closure', am: 'ሙሉ በሙሉ የተዘጋ መንገድ', om: 'Daandii Guutumaan Cufame' },
  FLOODING: { en: 'Flooding / Flash Water', am: 'የጎርፍ መጥለቅለቅ', om: 'Lolaa Bishaanii' },
  LANDSLIDE: { en: 'Landslide / Rockfall', am: 'የመሬት መንሸራተት / ድንጋይ', om: 'Sigiga Lafa / Dhagaa' },
  ROAD_DAMAGE: { en: 'Pothole / Road Damage', am: 'የመንገድ ጉድጓድ / ብልሽት', om: 'Boolla Daandii' },
  CONSTRUCTION: { en: 'Road Construction', am: 'የመንገድ ግንባታ', om: 'Ijaarsa Daandii' },
  HEAVY_TRAFFIC: { en: 'Heavy Traffic Jam', am: 'ከባድ የትራፊክ መጨናነቅ', om: 'Cuffama Tiraafikaa Cimaa' },
  HAZARD: { en: 'General Road Hazard', am: 'አደገኛ ሁኔታ', om: 'Balaa Daandii' },
  OTHER: { en: 'Other Disturbance', am: 'ሌላ አደጋ', om: 'Balaa Biroo' },
};

export const SEVERITY_LABELS: Record<IncidentSeverity, { en: string; am: string; om: string }> = {
  LOW: { en: 'Low', am: 'ቀላል', om: 'Salphaa' },
  MEDIUM: { en: 'Medium', am: 'መካከለኛ', om: 'Giddu-galeessa' },
  HIGH: { en: 'High', am: 'ከፍተኛ', om: 'Cimaa' },
  CRITICAL: { en: 'Critical', am: 'አስቸኳይ / አደገኛ', om: 'Murteessaa' },
};

export function formatDistance(meters?: number | null): string {
  if (meters === undefined || meters === null) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
