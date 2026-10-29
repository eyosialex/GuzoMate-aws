import { ConfirmationType, IncidentStatus, VerificationStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../shared/errors/app-error.js';
import { VERIFICATION_THRESHOLDS } from '../../shared/constants/verification.js';
import { ConfirmIncidentInput } from './confirmations.validation.js';
import { NotificationsService } from '../notifications/notifications.service.js';

export class ConfirmationsService {
  static async voteOnIncident(incidentId: string, userId: string, input: ConfirmIncidentInput) {
    const action = input.action as ConfirmationType;

    // 1. Fetch incident outside transaction to minimize transaction duration
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundError('Incident not found.');
    }

    // 2. Reporters cannot corroborate or dispute their own incident reports
    if (incident.reporterId === userId) {
      throw new BadRequestError('Reporters cannot confirm or dispute their own incident reports.');
    }

    // 3. Ineligible states
    if (
      incident.status === IncidentStatus.RESOLVED ||
      incident.status === IncidentStatus.REJECTED ||
      incident.status === IncidentStatus.EXPIRED
    ) {
      throw new BadRequestError(
        `Cannot verify an incident that is already ${incident.status.toLowerCase()}.`
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // 4. Check existing vote
        const existingVote = await tx.incidentConfirmation.findUnique({
          where: {
            incidentId_userId: {
              incidentId,
              userId,
            },
          },
        });

      let confirmationsDelta = 0;
      let disputesDelta = 0;

      if (existingVote) {
        if (existingVote.confirmationType === action) {
          throw new ConflictError(
            `You have already voted to ${action.toLowerCase()} this incident report.`
          );
        }

        // Switching vote
        if (action === ConfirmationType.CONFIRM) {
          confirmationsDelta = 1;
          disputesDelta = -1;
        } else {
          confirmationsDelta = -1;
          disputesDelta = 1;
        }

        await tx.incidentConfirmation.update({
          where: { id: existingVote.id },
          data: { confirmationType: action },
        });
      } else {
        // New vote
        if (action === ConfirmationType.CONFIRM) {
          confirmationsDelta = 1;
        } else {
          disputesDelta = 1;
        }

        await tx.incidentConfirmation.create({
          data: {
            incidentId,
            userId,
            confirmationType: action,
          },
        });
      }

      // Calculate new totals
      const newConfirmationsCount = Math.max(0, incident.confirmationsCount + confirmationsDelta);
      const newDisputesCount = Math.max(0, incident.disputesCount + disputesDelta);

      // Check automated threshold transitions
      let newStatus = incident.status;
      let newVerification = incident.verification;
      let triggeredActivation = false;

      // Rule: If PENDING and reaches >= 3 confirmations -> automatically ACTIVATE
      if (
        incident.status === IncidentStatus.PENDING &&
        newConfirmationsCount >= VERIFICATION_THRESHOLDS.CONFIRMATIONS_TO_ACTIVATE
      ) {
        newStatus = IncidentStatus.ACTIVE;
        newVerification = VerificationStatus.COMMUNITY_CONFIRMED;
        triggeredActivation = true;
      }

      // Rule: If >= 3 disputes and status was COMMUNITY_CONFIRMED -> mark for moderation
      if (newDisputesCount >= VERIFICATION_THRESHOLDS.DISPUTES_FOR_REVIEW) {
        await tx.auditLog.create({
          data: {
            action: 'INCIDENT_DISPUTE_FLAGGED',
            targetType: 'Incident',
            targetId: incidentId,
            reason: `Disputes reached threshold (${newDisputesCount} disputes). Flagged for moderation review.`,
            metadata: {
              confirmationsCount: newConfirmationsCount,
              disputesCount: newDisputesCount,
            },
          },
        });
      }

      const updatedIncident = await tx.incident.update({
        where: { id: incidentId },
        data: {
          confirmationsCount: newConfirmationsCount,
          disputesCount: newDisputesCount,
          status: newStatus,
          verification: newVerification,
        },
      });

      return {
        incidentId,
        action,
        status: updatedIncident.status,
        verification: updatedIncident.verification,
        confirmationsCount: updatedIncident.confirmationsCount,
        disputesCount: updatedIncident.disputesCount,
        triggeredActivation,
        incident: updatedIncident,
      };
    }, { maxWait: 15000, timeout: 120000 });

    // If the incident just became active, dispatch alerts to nearby subscribed users
    if (result.triggeredActivation && result.incident) {
      NotificationsService.dispatchNearbyAlerts(result.incident).catch(() => {
        // Non-blocking background notification failure
      });
    }

    return {
      incidentId: result.incidentId,
      action: result.action,
      status: result.status,
      verification: result.verification,
      confirmationsCount: result.confirmationsCount,
      disputesCount: result.disputesCount,
    };
  }
}
