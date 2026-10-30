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
} from './auth.validation.js';
import { JwtPayload } from '../../shared/types/auth.types.js';
import { AfroMessageService } from '../../services/afroMessage.service.js';

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
      email: user.email,
      phoneNumber: user.phoneNumber,
      isPhoneVerified: user.isPhoneVerified,
      name: user.name,
      role: user.role,
      status: user.status,
      preferredLanguage: user.preferredLanguage.toLowerCase(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Register a new traveler account.
   * Account is created in an unverified state (isPhoneVerified: false) and OTP is dispatched via AfroMessage.
   */
  static async register(input: RegisterInput) {
    // 1. Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingEmail) {
      throw new ConflictError('A user with this email address already exists.');
    }

    // 2. Check if phone number already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phoneNumber: input.phoneNumber },
    });
    if (existingPhone) {
      throw new ConflictError('A user with this phone number already exists.');
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
    const preferredLang = this.languageMap[input.preferredLanguage || 'en'] || Language.EN;

    // 4. Generate cryptographically secure OTP & hash
    const otp = this.generateRandomOtp(env.OTP_LENGTH);
    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);
    const resendAvailableAt = new Date(Date.now() + 60 * 1000); // 60 seconds cooldown

    // 5. Database transaction: Create user, default notification subscription, and OTP record
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          phoneNumber: input.phoneNumber,
          isPhoneVerified: false,
          passwordHash,
          name: input.name || null,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          preferredLanguage: preferredLang,
        },
      });

      // Default notification subscription for new user
      await tx.notificationSubscription.create({
        data: {
          userId: newUser.id,
          enabled: true,
          radiusMeters: 5000,
          incidentTypes: [],
        },
      });

      // Invalidate any stale OTP records for this phone number
      await tx.otpVerification.updateMany({
        where: {
          phoneNumber: input.phoneNumber,
          isUsed: false,
        },
        data: { isUsed: true },
      });

      // Store hashed OTP
      await tx.otpVerification.create({
        data: {
          phoneNumber: input.phoneNumber,
          otpHash,
          attempts: 0,
          maxAttempts: env.OTP_MAX_ATTEMPTS,
          expiresAt,
          resendAvailableAt,
          isUsed: false,
        },
      });

      return newUser;
    });

    // 6. Send OTP via AfroMessage SMS Provider
    await AfroMessageService.sendOtp(input.phoneNumber, otp);

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

    // Rate limit check: 60-second cooldown
    const latestOtp = await prisma.otpVerification.findFirst({
      where: { phoneNumber: input.phoneNumber },
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
        phoneNumber: input.phoneNumber,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (hourlyRequests >= 5) {
      throw new RateLimitError('Hourly OTP request limit exceeded. Please try again after an hour.');
    }

    // Invalidate existing active OTPs
    await prisma.otpVerification.updateMany({
      where: {
        phoneNumber: input.phoneNumber,
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
        phoneNumber: input.phoneNumber,
        otpHash,
        attempts: 0,
        maxAttempts: env.OTP_MAX_ATTEMPTS,
        expiresAt,
        resendAvailableAt,
        isUsed: false,
      },
    });

    // Send SMS
    await AfroMessageService.sendOtp(input.phoneNumber, otp);

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
}
