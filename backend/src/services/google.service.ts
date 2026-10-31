import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { UnauthorizedError, BadRequestError } from '../shared/errors/app-error.js';

export interface GoogleUserPayload {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  avatarUrl?: string;
}

export class GoogleService {
  private static customClient: OAuth2Client | null = null;

  /**
   * Retrieves an OAuth2Client instance configured with the current credentials.
   */
  static getClient(): OAuth2Client {
    if (this.customClient) {
      return this.customClient;
    }

    const clientId = (process.env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID)?.trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET)?.trim();
    const redirectUri =
      (process.env.GOOGLE_REDIRECT_URI || env.GOOGLE_REDIRECT_URI)?.trim() ||
      'http://localhost:8000/auth/google/callback';

    return new OAuth2Client(clientId, clientSecret, redirectUri);
  }

  /**
   * Override OAuth2Client instance for testing purposes.
   */
  static setOAuth2Client(customClient: OAuth2Client): void {
    this.customClient = customClient;
  }

  /**
   * Reset OAuth2Client back to default dynamic instance.
   */
  static resetOAuth2Client(): void {
    this.customClient = null;
  }

  /**
   * Retrieves all allowed Google Client IDs from environment variables.
   */
  static getAllowedAudiences(): string[] {
    const audiences = new Set<string>();

    const clientId = (process.env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID)?.trim();
    if (clientId) {
      audiences.add(clientId);
    }

    const clientIds = (process.env.GOOGLE_CLIENT_IDS || env.GOOGLE_CLIENT_IDS)?.trim();
    if (clientIds) {
      clientIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .forEach((id) => audiences.add(id));
    }

    return Array.from(audiences);
  }

  /**
   * Shared helper to enforce domain restrictions configured in GOOGLE_ALLOWED_EMAIL_DOMAINS.
   */
  private static validateDomain(email: string): void {
    const allowedDomainsRaw = (process.env.GOOGLE_ALLOWED_EMAIL_DOMAINS || env.GOOGLE_ALLOWED_EMAIL_DOMAINS)?.trim();
    if (allowedDomainsRaw) {
      const allowedDomains = allowedDomainsRaw
        .split(',')
        .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
        .filter(Boolean);
      const emailDomain = email.split('@')[1];
      if (allowedDomains.length > 0 && (!emailDomain || !allowedDomains.includes(emailDomain))) {
        throw new BadRequestError(`Email domain @${emailDomain} is not allowed. Allowed domains: ${allowedDomains.join(', ')}`);
      }
    }
  }

  /**
   * Generates Google OAuth authorization URL for redirect-based authentication.
   */
  static generateAuthUrl(state?: string, redirectUri?: string): string {
    const defaultRedirect =
      (process.env.GOOGLE_REDIRECT_URI || env.GOOGLE_REDIRECT_URI)?.trim() ||
      'http://localhost:8000/auth/google/callback';

    return this.getClient().generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
      redirect_uri: redirectUri || defaultRedirect,
      state: state || undefined,
    });
  }

  /**
   * Exchanges an authorization code received from Google OAuth for tokens,
   * then verifies and extracts the user identity.
   */
  static async exchangeCode(code: string, redirectUri?: string): Promise<GoogleUserPayload> {
    if (!code || typeof code !== 'string') {
      throw new UnauthorizedError('Google authorization code is required.');
    }

    const defaultRedirect =
      (process.env.GOOGLE_REDIRECT_URI || env.GOOGLE_REDIRECT_URI)?.trim() ||
      'http://localhost:8000/auth/google/callback';

    try {
      const { tokens } = await this.getClient().getToken({
        code,
        redirect_uri: redirectUri || defaultRedirect,
      });

      if (tokens.id_token) {
        return await this.verifyIdToken(tokens.id_token);
      }

      if (tokens.access_token) {
        return await this.verifyAccessToken(tokens.access_token);
      }

      throw new UnauthorizedError('Failed to retrieve user tokens from Google authorization code.');
    } catch (error: any) {
      if (error instanceof BadRequestError || error instanceof UnauthorizedError) {
        throw error;
      }

      logger.warn('[GoogleAuth] Authorization code exchange failed', {
        errorMessage: error.message,
      });

      throw new UnauthorizedError('Invalid or expired Google authorization code.');
    }
  }

  /**
   * Verifies a Google OAuth access token using Google tokeninfo and userinfo APIs.
   */
  static async verifyAccessToken(accessToken: string): Promise<GoogleUserPayload> {
    if (!accessToken || typeof accessToken !== 'string') {
      throw new UnauthorizedError('Google access token is required.');
    }

    try {
      // 1. Verify token validity and audience via Google tokeninfo
      const tokenInfo = await this.getClient().getTokenInfo(accessToken);
      const audiences = this.getAllowedAudiences();

      if (audiences.length > 0 && tokenInfo.aud && !audiences.includes(tokenInfo.aud)) {
        throw new UnauthorizedError('Google token audience mismatch.');
      }

      if (!tokenInfo.email_verified) {
        throw new UnauthorizedError('Google account email is not verified.');
      }

      // 2. Fetch user profile from Google userinfo endpoint
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userinfoRes.ok) {
        throw new UnauthorizedError('Failed to retrieve Google user profile.');
      }

      const profile = (await userinfoRes.json()) as any;
      if (!profile || !profile.sub) {
        throw new UnauthorizedError('Invalid Google user profile.');
      }

      if (!profile.email_verified) {
        throw new UnauthorizedError('Google account email is not verified.');
      }

      const normalizedEmail = (profile.email || tokenInfo.email || '').trim().toLowerCase();
      if (!normalizedEmail) {
        throw new UnauthorizedError('Google account email is missing.');
      }

      this.validateDomain(normalizedEmail);

      return {
        googleId: profile.sub,
        email: normalizedEmail,
        emailVerified: true,
        name: profile.name || undefined,
        avatarUrl: profile.picture || undefined,
      };
    } catch (error: any) {
      if (error instanceof BadRequestError || error instanceof UnauthorizedError) {
        throw error;
      }

      logger.warn('[GoogleAuth] Access token verification failed', {
        errorMessage: error.message,
      });

      throw new UnauthorizedError('Invalid or expired Google access token.');
    }
  }

  /**
   * Verifies Google ID token server-side using google-auth-library.
   * Validates signature, expiration, issuer, audience, and email_verified.
   */
  static async verifyIdToken(idToken: string): Promise<GoogleUserPayload> {
    if (!idToken || typeof idToken !== 'string') {
      throw new UnauthorizedError('Google ID token is required.');
    }

    // If a Google access token (starts with ya29.) was supplied instead of an ID token,
    // handle it transparently via verifyAccessToken.
    if (idToken.startsWith('ya29.')) {
      return this.verifyAccessToken(idToken);
    }

    const audiences = this.getAllowedAudiences();

    try {
      const ticket = await this.getClient().verifyIdToken({
        idToken,
        audience: audiences.length > 0 ? (audiences.length === 1 ? audiences[0] : audiences) : undefined,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub) {
        throw new UnauthorizedError('Invalid Google token payload.');
      }

      if (!payload.email_verified) {
        throw new UnauthorizedError('Google account email is not verified.');
      }

      if (!payload.email) {
        throw new UnauthorizedError('Google account email is missing.');
      }

      const normalizedEmail = payload.email.trim().toLowerCase();
      this.validateDomain(normalizedEmail);

      return {
        googleId: payload.sub,
        email: normalizedEmail,
        emailVerified: true,
        name: payload.name || undefined,
        avatarUrl: payload.picture || undefined,
      };
    } catch (error: any) {
      if (error instanceof BadRequestError || error instanceof UnauthorizedError) {
        throw error;
      }

      logger.warn('[GoogleAuth] Token verification failed', {
        errorMessage: error.message,
      });

      throw new UnauthorizedError('Invalid or expired Google ID token.');
    }
  }
}
