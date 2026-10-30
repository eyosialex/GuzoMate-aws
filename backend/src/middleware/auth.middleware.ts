import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import { UnauthorizedError, ForbiddenError } from '../shared/errors/app-error.js';
import { JwtPayload } from '../shared/types/auth.types.js';
import { UserStatus } from '@prisma/client';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        isPhoneVerified: true,
        role: true,
        status: true,
        preferredLanguage: true,
      },
    });

    if (!user) {
      return next(new UnauthorizedError('User account not found'));
    }

    if (user.status === UserStatus.SUSPENDED) {
      return next(new ForbiddenError('Account has been suspended. Please contact support.'));
    }

    if (!user.isPhoneVerified) {
      return next(new ForbiddenError('Phone number not verified. Please verify your phone number via OTP to access this resource.'));
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expired'));
    }
    return next(new UnauthorizedError('Invalid token'));
  }
}

export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        isPhoneVerified: true,
        role: true,
        status: true,
        preferredLanguage: true,
      },
    });

    if (user && user.status !== UserStatus.SUSPENDED && user.isPhoneVerified) {
      req.user = user;
    }
  } catch {
    // Ignore invalid optional tokens
  }

  next();
}
