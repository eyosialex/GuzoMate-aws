import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../shared/errors/app-error.js';

const isTest = process.env.NODE_ENV === 'test';

const testBypass = (_req: Request, _res: Response, next: NextFunction) => next();

export const authLimiter = isTest
  ? testBypass
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // limit each IP to 20 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, _res, next) => {
        next(new RateLimitError('Too many authentication attempts, please try again after 15 minutes.'));
      },
    });

export const incidentLimiter = isTest
  ? testBypass
  : rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 30, // limit each IP to 30 incident creations per hour
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, _res, next) => {
        next(new RateLimitError('Too many incident reports created, please try again later.'));
      },
    });

export const apiLimiter = isTest
  ? testBypass
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, _res, next) => {
        next(new RateLimitError('Too many requests, please slow down.'));
      },
    });
