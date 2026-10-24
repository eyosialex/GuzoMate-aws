import { IncidentStatus, IncidentType, IncidentSeverity, VerificationStatus, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError, ForbiddenError, BadRequestError } from '../../shared/errors/app-error.js';
import { VERIFICATION_THRESHOLDS, getIncidentExpirationDate } from '../../shared/constants/verification.js';
import { IncidentsRepository } from './incidents.repository.js';
import {
  CreateIncidentInput,
  UpdateIncidentInput,
  NearbyIncidentsQuery,
  ListIncidentsQuery,
} from './incidents.validation.js';
import { AuthUser } from '../../shared/types/auth.types.js';

export class IncidentsService {
  static async createIncident(userId: string, input: CreateIncidentInput) {
    const occurredAt = input.occurredAt || new Date();
    const sinceDate = new Date(Date.now() - VERIFICATION_THRESHOLDS.DUPLICATE_TIME_WINDOW_MS);

    // 1. Duplicate detection within 500 meters in the past 2 hours
    const duplicate = await IncidentsRepository.findNearbyDuplicate(
      input.type as IncidentType,
      input.lon,
      input.lat,
      VERIFICATION_THRESHOLDS.DUPLICATE_RADIUS_METERS,
      sinceDate
    );

    if (duplicate) {
      throw new ConflictError(
        'A similar incident was recently reported near this location. You can confirm or dispute the existing report.',
        'DUPLICATE_REPORT' as any
      );
    }

    // 2. Expiration timestamp
    const expiresAt = getIncidentExpirationDate(input.type as IncidentType, occurredAt);

    // 3. Create incident record
    const incident = await prisma.incident.create({
      data: {
        reporterId: userId,
        type: input.type as IncidentType,
        description: input.description,
        severity: (input.severity as IncidentSeverity) || IncidentSeverity.MEDIUM,
        latitude: input.lat,
        longitude: input.lon,
        status: IncidentStatus.PENDING,
        verification: VerificationStatus.UNVERIFIED,
        occurredAt,
        expiresAt,
        evidenceUrl: input.evidenceUrl || null,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: incident.id,
      type: incident.type,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      verification: incident.verification,
      location: {
        lat: incident.latitude,
        lon: incident.longitude,
      },
      confirmationsCount: incident.confirmationsCount,
      disputesCount: incident.disputesCount,
      occurredAt: incident.occurredAt,
      expiresAt: incident.expiresAt,
      evidenceUrl: incident.evidenceUrl,
      reporter: incident.reporter,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
    };
  }

  static async getNearbyIncidents(query: NearbyIncidentsQuery) {
    const { items, total } = await IncidentsRepository.findNearby(query);

    const formatted = items.map((item) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      severity: item.severity,
      status: item.status,
      verification: item.verification,
      location: {
        lat: item.latitude,
        lon: item.longitude,
      },
      distanceMeters: Number(item.distance_meters),
      confirmationsCount: item.confirmations_count,
      disputesCount: item.disputes_count,
      occurredAt: item.occurred_at,
      expiresAt: item.expires_at,
      evidenceUrl: item.evidence_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return {
      items: formatted,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  static async listIncidents(query: ListIncidentsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.IncidentWhereInput = {};

    if (query.type) {
      where.type = query.type as IncidentType;
    }

    if (query.severity) {
      where.severity = query.severity as IncidentSeverity;
    }

    if (query.status) {
      where.status = query.status as IncidentStatus;
    } else {
      where.status = {
        notIn: [IncidentStatus.REJECTED, IncidentStatus.EXPIRED],
      };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    let orderBy: Prisma.IncidentOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (query.sortBy === 'severity') {
      orderBy = { severity: 'desc' };
    }

    const items = await prisma.incident.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    const total = await prisma.incident.count({ where });

    const formatted = items.map((inc) => ({
      id: inc.id,
      type: inc.type,
      description: inc.description,
      severity: inc.severity,
      status: inc.status,
      verification: inc.verification,
      location: {
        lat: inc.latitude,
        lon: inc.longitude,
      },
      confirmationsCount: inc.confirmationsCount,
      disputesCount: inc.disputesCount,
      occurredAt: inc.occurredAt,
      expiresAt: inc.expiresAt,
      evidenceUrl: inc.evidenceUrl,
      reporter: inc.reporter,
      createdAt: inc.createdAt,
      updatedAt: inc.updatedAt,
    }));

    return {
      items: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getIncidentById(id: string, currentUserId?: string) {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!incident) {
      throw new NotFoundError('Incident not found.');
    }

    let userVote: string | null = null;
    if (currentUserId) {
      const confirmation = await prisma.incidentConfirmation.findUnique({
        where: {
          incidentId_userId: {
            incidentId: id,
            userId: currentUserId,
          },
        },
      });
      userVote = confirmation?.confirmationType || null;
    }

    return {
      id: incident.id,
      type: incident.type,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      verification: incident.verification,
      location: {
        lat: incident.latitude,
        lon: incident.longitude,
      },
      confirmationsCount: incident.confirmationsCount,
      disputesCount: incident.disputesCount,
      occurredAt: incident.occurredAt,
      expiresAt: incident.expiresAt,
      evidenceUrl: incident.evidenceUrl,
      reporter: incident.reporter,
      userVote,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
    };
  }

  static async updateIncident(id: string, user: AuthUser, input: UpdateIncidentInput) {
    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      throw new NotFoundError('Incident not found.');
    }

    const isReporter = incident.reporterId === user.id;
    const isStaff = user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN;

    if (!isReporter && !isStaff) {
      throw new ForbiddenError('You do not have permission to edit this incident report.');
    }

    if (isReporter && !isStaff) {
      if (incident.status !== IncidentStatus.PENDING) {
        throw new BadRequestError('Only pending incident reports can be edited by the reporter.');
      }
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        ...(input.description ? { description: input.description } : {}),
        ...(input.severity ? { severity: input.severity as IncidentSeverity } : {}),
        ...(input.evidenceUrl !== undefined ? { evidenceUrl: input.evidenceUrl } : {}),
      },
    });

    return {
      id: updated.id,
      type: updated.type,
      description: updated.description,
      severity: updated.severity,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }

  static async deleteIncident(id: string, user: AuthUser) {
    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      throw new NotFoundError('Incident not found.');
    }

    const isReporter = incident.reporterId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isReporter && !isAdmin) {
      throw new ForbiddenError('You do not have permission to withdraw or delete this incident.');
    }

    if (isReporter && !isAdmin) {
      if (incident.status !== IncidentStatus.PENDING) {
        throw new BadRequestError('Only pending reports can be withdrawn by the reporter.');
      }
    }

    await prisma.incident.delete({
      where: { id },
    });

    return { id, deleted: true };
  }
}
