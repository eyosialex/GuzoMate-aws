import { Language, Prisma, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../shared/errors/app-error.js';
import {
  UpdateProfileInput,
  UpdateNotificationPreferencesInput,
  AdminUpdateUserInput,
  ListUsersQuery,
} from './users.validation.js';

export class UsersService {
  private static languageMap: Record<string, Language> = {
    en: Language.EN,
    am: Language.AM,
    om: Language.OM,
  };

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        notificationSubscriptions: true,
        _count: {
          select: {
            reportedIncidents: true,
            incidentConfirmations: true,
            savedPlaces: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isPhoneVerified: user.isPhoneVerified,
      name: user.name,
      role: user.role,
      status: user.status,
      preferredLanguage: user.preferredLanguage.toLowerCase(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        reportedIncidentsCount: user._count.reportedIncidents,
        confirmationsCount: user._count.incidentConfirmations,
        savedPlacesCount: user._count.savedPlaces,
      },
    };
  }

  static async updateProfile(userId: string, input: UpdateProfileInput) {
    const data: Prisma.UserUpdateInput = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.preferredLanguage) {
      data.preferredLanguage = this.languageMap[input.preferredLanguage] || Language.EN;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      status: updated.status,
      preferredLanguage: updated.preferredLanguage.toLowerCase(),
      updatedAt: updated.updatedAt,
    };
  }

  static async getNotificationPreferences(userId: string) {
    let sub = await prisma.notificationSubscription.findFirst({
      where: { userId },
    });

    if (!sub) {
      sub = await prisma.notificationSubscription.create({
        data: {
          userId,
          enabled: true,
          radiusMeters: 5000,
          incidentTypes: [],
        },
      });
    }

    return {
      enabled: sub.enabled,
      radiusMeters: sub.radiusMeters,
      incidentTypes: sub.incidentTypes,
      updatedAt: sub.updatedAt,
    };
  }

  static async updateNotificationPreferences(
    userId: string,
    input: UpdateNotificationPreferencesInput
  ) {
    let sub = await prisma.notificationSubscription.findFirst({
      where: { userId },
    });

    if (!sub) {
      sub = await prisma.notificationSubscription.create({
        data: {
          userId,
          enabled: input.enabled ?? true,
          radiusMeters: input.radiusMeters ?? 5000,
          incidentTypes: input.incidentTypes ?? [],
        },
      });
    } else {
      sub = await prisma.notificationSubscription.update({
        where: { id: sub.id },
        data: {
          enabled: input.enabled !== undefined ? input.enabled : sub.enabled,
          radiusMeters: input.radiusMeters !== undefined ? input.radiusMeters : sub.radiusMeters,
          incidentTypes: input.incidentTypes !== undefined ? input.incidentTypes : sub.incidentTypes,
        },
      });
    }

    return {
      enabled: sub.enabled,
      radiusMeters: sub.radiusMeters,
      incidentTypes: sub.incidentTypes,
      updatedAt: sub.updatedAt,
    };
  }

  // --- Admin functionality ---

  static async listUsers(query: ListUsersQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        isPhoneVerified: true,
        name: true,
        role: true,
        status: true,
        preferredLanguage: true,
        createdAt: true,
      },
    });
    const total = await prisma.user.count({ where });

    return {
      users: users.map((u) => ({
        ...u,
        preferredLanguage: u.preferredLanguage.toLowerCase(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async adminUpdateUser(
    adminUserId: string,
    targetUserId: string,
    input: AdminUpdateUserInput
  ) {
    if (adminUserId === targetUserId && input.status === UserStatus.SUSPENDED) {
      throw new BadRequestError('Administrators cannot suspend their own account.');
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!target) {
      throw new NotFoundError('Target user not found.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: targetUserId },
        data: {
          ...(input.role ? { role: input.role } : {}),
          ...(input.status ? { status: input.status } : {}),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: 'ADMIN_USER_UPDATE',
          targetType: 'User',
          targetId: targetUserId,
          reason: input.reason || null,
          metadata: {
            previousRole: target.role,
            newRole: u.role,
            previousStatus: target.status,
            newStatus: u.status,
          },
        },
      });

      return u;
    });

    return updated;
  }
}
