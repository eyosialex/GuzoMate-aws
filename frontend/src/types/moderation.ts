import { IncidentType, IncidentSeverity, IncidentStatus, VerificationStatus } from './incidents';

export interface ModerationIncidentItem {
  id: string;
  type: IncidentType;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  verification: VerificationStatus;
  location: {
    lat: number;
    lon: number;
  };
  confirmationsCount: number;
  disputesCount: number;
  occurredAt?: string;
  expiresAt?: string;
  evidenceUrl?: string | null;
  reporter?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListModerationIncidentsQuery {
  status?: IncidentStatus;
  type?: IncidentType;
  severity?: IncidentSeverity;
  disputedOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface UpdateIncidentStatusPayload {
  status: IncidentStatus;
  reason?: string;
}

export interface UpdateIncidentStatusResponse {
  id: string;
  status: IncidentStatus;
  verification: VerificationStatus;
  updatedAt: string;
}

export interface AuditLogActor {
  id: string;
  name: string | null;
  role: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  reason: string | null;
  metadata?: Record<string, any>;
  actor?: AuditLogActor | null;
  createdAt: string;
}

export interface IncidentHistoryResponse {
  incidentId: string;
  history: AuditLogEntry[];
}

export class InvalidStatusTransitionError extends Error {
  code = 'INVALID_STATUS_TRANSITION';
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStatusTransitionError';
  }
}
