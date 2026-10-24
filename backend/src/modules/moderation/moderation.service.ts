import { IncidentStatus, VerificationStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../shared/errors/app-error.js';
import { UpdateIncidentStatusInput, ListModerationIncidentsQuery } from './moderation.validation.js';
import { NotificationsService } from '../notifications/notifications.service.js';

export class ModerationService {
  private static allowedTransitions: Record<IncidentStatus, IncidentStatus[]> = {
    PENDING: [IncidentStatus.ACTIVE, IncidentStatus.REJECTED],
    ACTIVE: [IncidentStatus.RESOLVED, IncidentStatus.EXPIRED, IncidentStatus.REJECTED],
    RESOLVED: [IncidentStatus.ACTIVE],
    EXPIRED: [IncidentStatus.ACTIVE],
    REJECTED: [IncidentStatus.ACTIVE], // Permitted if reopened after review
  };

  static async listIncidentsForReview(query: ListModerationIncidentsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.IncidentWhereInput = {};

    if (query.status) {
      where.status = query.status as IncidentStatus;
    } else {
      where.status = { in: [IncidentStatus.PENDING, IncidentStatus.ACTIVE] };
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    if (query.disputedOnly) {
      where.disputesCount = { gt: 0 };
    }

    const items = await prisma.incident.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ disputesCount: 'desc' }, { createdAt: 'desc' }],
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
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

  static async updateIncidentStatus(
    moderatorUserId: string,
    incidentId: string,
    input: UpdateIncidentStatusInput
  ) {
    const targetStatus = input.status as IncidentStatus;

    const result = await prisma.$transaction(async (tx) => {
      const incident = await tx.incident.findUnique({
        where: { id: incidentId },
      });

      if (!incident) {
        throw new NotFoundError('Incident not found.');
      }

      if (incident.status === targetStatus) {
        return { incident, statusChanged: false };
      }

      // Check state machine transition
      const allowed = this.allowedTransitions[incident.status];
      if (!allowed || !allowed.includes(targetStatus)) {
        throw new BadRequestError(
          `Invalid incident status transition from ${incident.status} to ${targetStatus}.`
        );
      }

      // If moderator activates incident, mark MODERATOR_VERIFIED
      let verification = incident.verification;
      if (targetStatus === IncidentStatus.ACTIVE) {
        verification = VerificationStatus.MODERATOR_VERIFIED;
      }

      const updated = await tx.incident.update({
        where: { id: incidentId },
        data: {
          status: targetStatus,
          verification,
        },
      });

      // Audit log the status transition
      await tx.auditLog.create({
        data: {
          actorUserId: moderatorUserId,
          action: 'MODERATION_STATUS_CHANGE',
          targetType: 'Incident',
          targetId: incidentId,
          reason: input.reason || null,
          metadata: {
            fromStatus: incident.status,
            toStatus: targetStatus,
            fromVerification: incident.verification,
            toVerification: verification,
          },
        },
      });

      return { incident: updated, statusChanged: true };
    });

    // If activated by moderator, dispatch alerts to nearby users
    if (result.statusChanged && result.incident.status === IncidentStatus.ACTIVE) {
      NotificationsService.dispatchNearbyAlerts(result.incident).catch(() => {});
    }

    return {
      id: result.incident.id,
      status: result.incident.status,
      verification: result.incident.verification,
      updatedAt: result.incident.updatedAt,
    };
  }

  static async getIncidentHistory(incidentId: string) {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundError('Incident not found.');
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        targetType: 'Incident',
        targetId: incidentId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return {
      incidentId,
      history: logs.map((log) => ({
        id: log.id,
        action: log.action,
        reason: log.reason,
        metadata: log.metadata,
        actor: log.actor,
        createdAt: log.createdAt,
      })),
    };
  }
}
