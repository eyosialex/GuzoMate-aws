import { Prisma, Incident, IncidentType, IncidentSeverity, IncidentStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NearbyIncidentsQuery } from './incidents.validation.js';

export interface NearbyIncidentResult {
  id: string;
  reporter_id: string | null;
  type: IncidentType;
  description: string;
  latitude: number;
  longitude: number;
  status: IncidentStatus;
  severity: IncidentSeverity | null;
  verification: string;
  confirmations_count: number;
  disputes_count: number;
  occurred_at: Date | null;
  expires_at: Date | null;
  evidence_url: string | null;
  created_at: Date;
  updated_at: Date;
  distance_meters: number;
}

export class IncidentsRepository {
  /**
   * Find recent duplicate incidents of the same type within radius
   */
  static async findNearbyDuplicate(
    type: IncidentType,
    lon: number,
    lat: number,
    radiusMeters: number,
    sinceDate: Date
  ): Promise<Incident | null> {
    const results = await prisma.$queryRaw<Incident[]>`
      SELECT id, type, description, latitude, longitude, status, severity, created_at, updated_at
      FROM incidents
      WHERE type = ${type}::incident_type
        AND status IN ('PENDING'::incident_status, 'ACTIVE'::incident_status)
        AND created_at >= ${sinceDate}
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
      LIMIT 1;
    `;

    return results[0] || null;
  }

  /**
   * PostGIS geospatial search for incidents near coordinates
   */
  static async findNearby(query: NearbyIncidentsQuery): Promise<{ items: NearbyIncidentResult[]; total: number }> {
    const { lon, lat, radius, type, severity, status, page, limit } = query;
    const offset = (page - 1) * limit;

    // Filters condition
    const conditions: Prisma.Sql[] = [
      Prisma.sql`ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography, ${radius})`,
    ];

    if (type) {
      conditions.push(Prisma.sql`type = ${type}::incident_type`);
    }

    if (severity) {
      conditions.push(Prisma.sql`severity = ${severity}::incident_severity`);
    }

    if (status) {
      conditions.push(Prisma.sql`status = ${status}::incident_status`);
    } else {
      // By default exclude expired and rejected incidents
      conditions.push(Prisma.sql`status NOT IN ('REJECTED'::incident_status, 'EXPIRED'::incident_status)`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    // Get count
    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count
      FROM incidents
      ${whereClause};
    `;
    const total = Number(countResult[0]?.count || 0);

    // Get items sorted by distance
    const items = await prisma.$queryRaw<NearbyIncidentResult[]>`
      SELECT 
        id,
        reporter_id,
        type,
        description,
        latitude,
        longitude,
        status,
        severity,
        verification,
        confirmations_count,
        disputes_count,
        occurred_at,
        expires_at,
        evidence_url,
        created_at,
        updated_at,
        ROUND(ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
        )::numeric, 1) as distance_meters
      FROM incidents
      ${whereClause}
      ORDER BY distance_meters ASC
      LIMIT ${limit} OFFSET ${offset};
    `;

    return { items, total };
  }
}
