import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole, UserStatus, Language } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { ConflictError, UnauthorizedError, ForbiddenError, NotFoundError } from '../../shared/errors/app-error.js';
import { RegisterInput, LoginInput } from './auth.validation.js';
import { JwtPayload } from '../../shared/types/auth.types.js';

export class AuthService {
  private static languageMap: Record<string, Language> = {
    en: Language.EN,
    am: Language.AM,
    om: Language.OM,
  };

  private static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  private static sanitizeUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      preferredLanguage: user.preferredLanguage.toLowerCase(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
    const preferredLang = this.languageMap[input.preferredLanguage || 'en'] || Language.EN;

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name || null,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          preferredLanguage: preferredLang,
        },
      });

      // Default notification subscription for the new traveler
      await tx.notificationSubscription.create({
        data: {
          userId: newUser.id,
          enabled: true,
          radiusMeters: 5000,
          incidentTypes: [],
        },
      });

      return newUser;
    });

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      accessToken: token,
    };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError('Your account has been suspended. Please contact moderation.');
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      accessToken: token,
    };
  }

  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    return this.sanitizeUser(user);
  }
}
