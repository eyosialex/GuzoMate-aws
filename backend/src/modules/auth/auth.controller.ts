import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { GoogleService } from '../../services/google.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { BadRequestError, UnauthorizedError } from '../../shared/errors/app-error.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.verifyOtp(req.body);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.resendOtp(req.body);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser(req.user!.id);
      sendSuccess(res, { user }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/google — Initiates Google OAuth redirect or returns authorization URL.
   */
  static async googleRedirect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const state = req.query.state ? String(req.query.state) : undefined;
      const redirectUri = req.query.redirectUri ? String(req.query.redirectUri) : undefined;
      const authUrl = GoogleService.generateAuthUrl(state, redirectUri);

      // If client requests JSON or sets format=json, return the URL
      if (req.query.format === 'json' || req.headers.accept === 'application/json') {
        sendSuccess(res, { authUrl }, 200);
        return;
      }

      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/google/callback — Google OAuth redirect callback endpoint.
   */
  static async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.query.error) {
        throw new UnauthorizedError(String(req.query.error_description || req.query.error));
      }

      const code = req.query.code ? String(req.query.code) : undefined;
      if (!code) {
        throw new BadRequestError('Authorization code is missing from Google callback.');
      }

      const result = await AuthService.googleAuth({ code });
      sendSuccess(res, result, result.isNewUser ? 201 : 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/google — Unified Google authentication via ID token, code, or access token.
   */
  static async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // If token wasn't provided in body but was sent in Authorization header (common in Postman OAuth 2.0)
      if (!req.body.idToken && !req.body.code && !req.body.accessToken && req.headers.authorization) {
        const authHeader = req.headers.authorization.trim();
        if (authHeader.startsWith('Bearer ')) {
          const bearerToken = authHeader.substring(7).trim();
          if (bearerToken) {
            req.body.idToken = bearerToken;
          }
        }
      }

      const result = await AuthService.googleAuth(req.body);
      sendSuccess(res, result, result.isNewUser ? 201 : 200);
    } catch (error) {
      next(error);
    }
  }
}
