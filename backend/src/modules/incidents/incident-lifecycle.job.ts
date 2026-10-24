import { IncidentStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';

export class IncidentLifecycleJob {
  private static timer: NodeJS.Timeout | null = null;

  /**
   * Expire incidents that have passed their expiration timestamp.
   * Idempotent and safe to run concurrently.
   */
  static async expireOverdueIncidents(now = new Date()): Promise<number> {
    try {
      const result = await prisma.incident.updateMany({
        where: {
          status: { in: [IncidentStatus.PENDING, IncidentStatus.ACTIVE] },
          expiresAt: { lte: now },
        },
        data: {
          status: IncidentStatus.EXPIRED,
        },
      });

      if (result.count > 0) {
        logger.info(`[IncidentLifecycleJob] Expired ${result.count} overdue incidents.`);
      }

      return result.count;
    } catch (error) {
      logger.error('[IncidentLifecycleJob] Failed to expire overdue incidents:', error);
      return 0;
    }
  }

  /**
   * Start recurring background worker
   */
  static start(intervalMs = 5 * 60 * 1000): void {
    if (this.timer) return;

    logger.info(`[IncidentLifecycleJob] Started expiration background worker (interval: ${intervalMs}ms).`);
    this.timer = setInterval(() => {
      this.expireOverdueIncidents().catch(() => {});
    }, intervalMs);
  }

  /**
   * Stop background worker (for clean shutdown/testing)
   */
  static stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('[IncidentLifecycleJob] Stopped expiration background worker.');
    }
  }
}
