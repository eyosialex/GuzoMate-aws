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
   * Helper to resolve the frontend application URL for OAuth redirects.
   * Prioritizes state param, env var, or defaults to production Vercel / localhost.
   */
  private static resolveFrontendUrl(state?: string, host?: string): string {
    if (state && (state.startsWith('http://') || state.startsWith('https://'))) {
      try {
        const parsed = new URL(state);
        if (
          parsed.hostname === 'localhost' ||
          parsed.hostname === '127.0.0.1' ||
          parsed.hostname.endsWith('vercel.app') ||
          parsed.hostname.includes('guzo-mate')
        ) {
          return `${parsed.protocol}//${parsed.host}`;
        }
      } catch {
        // Fallback
      }
    }

    if (process.env.FRONTEND_URL) {
      return process.env.FRONTEND_URL.replace(/\/+$/, '');
    }

    if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
      return 'http://localhost:5173';
    }

    return 'https://guzo-mate-aws.vercel.app';
  }

  /**
   * GET /auth/google/callback — Google OAuth redirect callback endpoint.
   * In a browser (e.g. Google redirect), redirects to frontend homepage with token
   * (or authError on failure) so the frontend stays in the login modal showing the error.
   * For automated tests and API callers, returns JSON.
   */
  static async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    const isBrowserNavigation =
      req.headers['sec-fetch-mode'] === 'navigate' ||
      req.headers['sec-fetch-dest'] === 'document' ||
      Boolean(req.headers.accept && req.headers.accept.includes('text/html')) ||
      req.query.redirect === 'true';

    const state = req.query.state ? String(req.query.state) : undefined;
    const frontendUrl = AuthController.resolveFrontendUrl(state, req.headers.host);

    try {
      if (req.query.error) {
        throw new UnauthorizedError(String(req.query.error_description || req.query.error));
      }

      const code = req.query.code ? String(req.query.code) : undefined;
      if (!code) {
        throw new BadRequestError('Authorization code is missing from Google callback.');
      }

      const result = await AuthService.googleAuth({ code });

      if (isBrowserNavigation) {
        // Browser redirect to frontend homepage with token
        const redirectTarget = new URL(frontendUrl);
        redirectTarget.searchParams.set('token', result.accessToken);
        if (result.isNewUser) {
          redirectTarget.searchParams.set('isNewUser', 'true');
        }
        res.redirect(redirectTarget.toString());
        return;
      }

      sendSuccess(res, result, result.isNewUser ? 201 : 200);
    } catch (error: any) {
      if (isBrowserNavigation) {
        // Browser redirect to frontend homepage with error to stay in login modal
        const redirectTarget = new URL(frontendUrl);
        redirectTarget.searchParams.set(
          'authError',
          error.message || 'Google authentication failed. Please try again.'
        );
        res.redirect(redirectTarget.toString());
        return;
      }

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
