import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole, UserStatus, Language } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  RateLimitError,
} from '../../shared/errors/app-error.js';
import {
  RegisterInput,
  LoginInput,
  VerifyOtpInput,
  ResendOtpInput,
  GoogleAuthInput,
} from './auth.validation.js';
import { JwtPayload } from '../../shared/types/auth.types.js';
import { AfroMessageService } from '../../services/afroMessage.service.js';
import { GoogleService } from '../../services/google.service.js';

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

  private static hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  private static generateRandomOtp(length: number): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length);
    return crypto.randomInt(min, max).toString();
  }

  private static sanitizeUser(user: any) {
    return {
      id: user.id,
      fullName: user.fullName || user.name || null,
      name: user.name || user.fullName || null,
      phoneNumber: user.phoneNumber,
      email: user.email,
      isPhoneVerified: user.isPhoneVerified,
      avatarUrl: user.avatarUrl ?? null,
      googleId: user.googleId ?? null,
      authProvider: user.authProvider || (user.googleId ? 'google' : 'local'),
      authProviders: user.authProviders ?? (user.googleId ? ['google'] : ['local']),
      role: user.role,
      status: user.status,
      preferredLanguage: user.preferredLanguage ? user.preferredLanguage.toLowerCase() : 'en',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Shared helper to check OTP rate limits, generate a cryptographically secure OTP,
   * persist it to the database, and dispatch it via AfroMessage.
   */
  private static async sendAndRecordOtp(phoneNumber: string): Promise<string> {
    // Rate limit check: 60-second cooldown
    const latestOtp = await prisma.otpVerification.findFirst({
      where: { phoneNumber },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp && new Date() < latestOtp.resendAvailableAt) {
      const secondsLeft = Math.ceil((latestOtp.resendAvailableAt.getTime() - Date.now()) / 1000);
      throw new RateLimitError(`Please wait ${secondsLeft} seconds before requesting a new code.`);
    }

    // Rate limit check: Max 5 resends per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyRequests = await prisma.otpVerification.count({
      where: {
        phoneNumber,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (hourlyRequests >= 5) {
      throw new RateLimitError('Hourly OTP request limit exceeded. Please try again after an hour.');
    }

    // Invalidate existing active OTPs
    await prisma.otpVerification.updateMany({
      where: {
        phoneNumber,
        isUsed: false,
      },
      data: { isUsed: true },
    });

    // Generate new OTP
    const otp = this.generateRandomOtp(env.OTP_LENGTH);
    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);
    const resendAvailableAt = new Date(Date.now() + 60 * 1000);

    await prisma.otpVerification.create({
      data: {
        phoneNumber,
        otpHash,
        attempts: 0,
        maxAttempts: env.OTP_MAX_ATTEMPTS,
        expiresAt,
        resendAvailableAt,
        isUsed: false,
      },
    });

    // Send SMS via AfroMessage
    await AfroMessageService.sendOtp(phoneNumber, otp);

    return otp;
  }

  /**
   * Register a new traveler account (Mechanism B: Phone + Password + OTP).
   * Account is created in an unverified state (isPhoneVerified: false) and OTP is dispatched via AfroMessage.
   * If an unverified account already exists with this phone, its details are updated and a fresh OTP is resent.
   */
  static async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: input.phoneNumber },
    });

    if (existingUser && existingUser.isPhoneVerified) {
      throw new ConflictError('A user with this phone number is already registered and verified.');
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
    const preferredLang = this.languageMap[input.preferredLanguage || 'en'] || Language.EN;

    let user: any;

    if (existingUser) {
      // Re-registration for unverified phone: update profile & password, resend OTP
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          fullName: input.fullName,
          name: input.fullName,
          passwordHash,
          preferredLanguage: preferredLang,
          authProvider: 'local',
          authProviders: ['local'],
        },
      });
    } else {
      // Create new unverified user
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            fullName: input.fullName,
            name: input.fullName,
            phoneNumber: input.phoneNumber,
            isPhoneVerified: false,
            passwordHash,
            authProvider: 'local',
            authProviders: ['local'],
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
            preferredLanguage: preferredLang,
          },
        });

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
    }

    // Generate & send OTP via AfroMessage
    const otp = await this.sendAndRecordOtp(input.phoneNumber);

    const isNonProd = env.NODE_ENV !== 'production';
    const exposeOtp = isNonProd && (env.DEV_EXPOSE_OTP || env.NODE_ENV === 'test');

    return {
      message: 'Registration successful. A verification code has been sent to your phone number.',
      user: this.sanitizeUser(user),
      ...(exposeOtp ? { devOtp: otp } : {}),
    };
  }

  /**
   * Verify phone number with OTP.
   * On success, marks user as verified and returns accessToken.
   */
  static async verifyOtp(input: VerifyOtpInput) {
    const latestOtp = await prisma.otpVerification.findFirst({
      where: {
        phoneNumber: input.phoneNumber,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp) {
      throw new BadRequestError('No active verification code found for this phone number. Please request a new code.');
    }

    if (latestOtp.isUsed) {
      if (latestOtp.attempts >= latestOtp.maxAttempts) {
        throw new BadRequestError('Too many failed attempts. This code has been invalidated. Please request a new code.');
      }
      throw new BadRequestError('This verification code has already been used or invalidated. Please request a new code.');
    }

    // Check expiry
    if (new Date() > latestOtp.expiresAt) {
      await prisma.otpVerification.update({
        where: { id: latestOtp.id },
        data: { isUsed: true },
      });
      throw new BadRequestError('Verification code has expired. Please request a new code.');
    }

    // Check maximum attempts
    if (latestOtp.attempts >= latestOtp.maxAttempts) {
      await prisma.otpVerification.update({
        where: { id: latestOtp.id },
        data: { isUsed: true },
      });
      throw new BadRequestError('Too many failed attempts. This code has been invalidated. Please request a new code.');
    }

    // Compare hash
    const inputHash = this.hashOtp(input.otp);
    if (inputHash !== latestOtp.otpHash) {
      const nextAttempts = latestOtp.attempts + 1;
      const isLocked = nextAttempts >= latestOtp.maxAttempts;

      await prisma.otpVerification.update({
        where: { id: latestOtp.id },
        data: {
          attempts: nextAttempts,
          isUsed: isLocked,
        },
      });

      if (isLocked) {
        throw new BadRequestError('Too many failed attempts. This code has been invalidated. Please request a new code.');
      }

      const remaining = latestOtp.maxAttempts - nextAttempts;
      throw new BadRequestError(`Invalid verification code. ${remaining} attempt(s) remaining.`);
    }

    // Valid code: mark code as used and mark user as verified
    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { phoneNumber: input.phoneNumber },
        data: { isPhoneVerified: true },
      }),
      prisma.otpVerification.update({
        where: { id: latestOtp.id },
        data: { isUsed: true },
      }),
    ]);

    const accessToken = this.generateToken({
      userId: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });

    return {
      message: 'Phone number verified successfully.',
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  /**
   * Resend a fresh OTP to the user's phone number.
   * Rate limited: 1 request per 60 seconds, max 5 per hour.
   */
  static async resendOtp(input: ResendOtpInput) {
    const user = await prisma.user.findUnique({
      where: { phoneNumber: input.phoneNumber },
    });

    if (!user) {
      throw new NotFoundError('No user account associated with this phone number.');
    }

    if (user.isPhoneVerified) {
      throw new BadRequestError('Phone number is already verified.');
    }

    const otp = await this.sendAndRecordOtp(input.phoneNumber);

    const isNonProd = env.NODE_ENV !== 'production';
    const exposeOtp = isNonProd && (env.DEV_EXPOSE_OTP || env.NODE_ENV === 'test');

    return {
      message: 'A new verification code has been sent to your phone number.',
      ...(exposeOtp ? { devOtp: otp } : {}),
    };
  }

  /**
   * Login using phone number and password only.
   */
  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { phoneNumber: input.phoneNumber },
    });

    // Generic error to avoid user enumeration
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError('Your account has been suspended. Please contact moderation.');
    }

    if (!user.isPhoneVerified) {
      throw new ForbiddenError('Phone number not verified. Please verify your phone number via OTP.');
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      accessToken: token,
    };
  }

  /**
   * Fetch currently authenticated user profile.
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Mechanism A: Continue with Google (Unified Sign-in & Sign-up).
   * Verifies ID token with google-auth-library. No phone verification required.
   * Google accounts and phone accounts are strictly independent (no account linking).
   */
  static async googleAuth(input: GoogleAuthInput) {
    const payload = await GoogleService.verifyIdToken(input.idToken);

    // Primary & ONLY lookup by googleId (no account linking by email)
    let user = await prisma.user.findUnique({
      where: { googleId: payload.googleId },
    });

    let isNewUser = false;

    if (user) {
      if (user.status === UserStatus.SUSPENDED) {
        throw new ForbiddenError('Your account has been suspended. Please contact moderation.');
      }

      // Update avatar if not present
      if (payload.avatarUrl && !user.avatarUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: payload.avatarUrl },
        });
      }
    } else {
      // Create new Google user
      try {
        user = await prisma.$transaction(async (tx) => {
          const created = await tx.user.create({
            data: {
              email: payload.email,
              googleId: payload.googleId,
              fullName: payload.name || null,
              name: payload.name || null,
              avatarUrl: payload.avatarUrl || null,
              authProvider: 'google',
              authProviders: ['google'],
              isPhoneVerified: false, // Phone verification not required for Google users
              role: UserRole.USER,
              status: UserStatus.ACTIVE,
              preferredLanguage: Language.EN,
            },
          });

          await tx.notificationSubscription.create({
            data: {
              userId: created.id,
              enabled: true,
              radiusMeters: 5000,
              incidentTypes: [],
            },
          });

          return created;
        });
        isNewUser = true;
      } catch (error: any) {
        if (error.code === 'P2002') {
          user = await prisma.user.findUnique({
            where: { googleId: payload.googleId },
          });
          if (!user) {
            throw new ConflictError('A user with these Google credentials already exists.');
          }
        } else {
          throw error;
        }
      }
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      accessToken: token,
      isNewUser,
    };
  }
}
