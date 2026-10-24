import { Incident, IncidentSeverity, Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import { RegisterDeviceTokenInput, ListNotificationsQuery } from './notifications.validation.js';
import { FCMNotificationProvider } from './providers/fcm.provider.js';
import { INotificationProvider } from './providers/notification.provider.interface.js';
import { logger } from '../../config/logger.js';

export class NotificationsService {
  private static provider: INotificationProvider = new FCMNotificationProvider();

  static setProvider(customProvider: INotificationProvider): void {
    this.provider = customProvider;
  }

  static getProvider(): INotificationProvider {
    return this.provider;
  }

  static async registerDeviceToken(userId: string, input: RegisterDeviceTokenInput) {
    const device = await prisma.deviceToken.upsert({
      where: { token: input.token },
      update: {
        userId,
        platform: input.platform,
        isActive: true,
      },
      create: {
        userId,
        token: input.token,
        platform: input.platform,
        isActive: true,
      },
    });

    return {
      id: device.id,
      token: device.token,
      platform: device.platform,
      isActive: device.isActive,
    };
  }

  static async removeDeviceToken(userId: string, token: string) {
    await prisma.deviceToken.updateMany({
      where: {
        userId,
        token,
      },
      data: {
        isActive: false,
      },
    });

    return { token, active: false };
  }

  static async getUserNotifications(userId: string, query: ListNotificationsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.unreadOnly ? { isRead: false } : {}),
    };

    const items = await prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    const total = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      items,
      unreadCount,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found.');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return updated;
  }

  static async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updatedCount: result.count };
  }

  /**
   * Dispatch road safety notifications to eligible subscribed users
   */
  static async dispatchNearbyAlerts(incident: Incident) {
    try {
      // 1. Find users with active notification subscriptions matching incident
      const subscriptions = await prisma.notificationSubscription.findMany({
        where: {
          enabled: true,
          userId: { not: incident.reporterId || undefined },
        },
        include: {
          user: {
            include: {
              deviceTokens: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      if (!subscriptions.length) return;

      const title = `🚨 Road Alert: ${incident.type.replace(/_/g, ' ')}`;
      const message = `${incident.description} (Severity: ${incident.severity || 'MEDIUM'})`;

      const recipientUserIds: string[] = [];
      const recipientTokens: string[] = [];

      for (const sub of subscriptions) {
        // Filter by subscribed incident types if specified
        if (sub.incidentTypes && sub.incidentTypes.length > 0) {
          if (!sub.incidentTypes.includes(incident.type)) {
            continue;
          }
        }

        recipientUserIds.push(sub.userId);
        for (const dev of sub.user.deviceTokens) {
          recipientTokens.push(dev.token);
        }
      }

      if (!recipientUserIds.length) return;

      // Deduplicate: check which users haven't received notification for this incident yet
      const existingNotifs = await prisma.notification.findMany({
        where: {
          incidentId: incident.id,
          userId: { in: recipientUserIds },
        },
        select: { userId: true },
      });

      const alreadyNotified = new Set(existingNotifs.map((n) => n.userId));
      const targetUserIds = recipientUserIds.filter((id) => !alreadyNotified.has(id));

      if (targetUserIds.length > 0) {
        // 2. Persist in-app notifications in batch
        await prisma.notification.createMany({
          data: targetUserIds.map((userId) => ({
            userId,
            incidentId: incident.id,
            type: 'INCIDENT_ALERT',
            title,
            message,
            deliveryStatus: recipientTokens.length > 0 ? 'SENT' : 'PENDING',
            deliveredAt: new Date(),
          })),
        });

        logger.info(`[Notifications] Persisted in-app alerts for ${targetUserIds.length} users.`);
      }

      // 3. Dispatch push notifications via FCM or mock provider
      if (recipientTokens.length > 0) {
        const uniqueTokens = Array.from(new Set(recipientTokens));
        const pushPayload = {
          title,
          body: message,
          data: {
            incidentId: incident.id,
            type: incident.type,
            severity: incident.severity || 'MEDIUM',
          },
        };

        const results = await this.provider.sendToDevices(uniqueTokens, pushPayload);

        // Deactivate invalid device tokens reported by provider
        for (let i = 0; i < results.length; i++) {
          if (results[i].invalidToken) {
            await prisma.deviceToken.updateMany({
              where: { token: uniqueTokens[i] },
              data: { isActive: false },
            });
          }
        }
      }
    } catch (error) {
      logger.error('[NotificationsService] Error dispatching alerts:', error);
    }
  }
}
