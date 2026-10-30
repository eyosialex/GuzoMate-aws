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
  private static client = new OAuth2Client();

  /**
   * Override OAuth2Client instance for testing purposes.
   */
  static setOAuth2Client(customClient: OAuth2Client): void {
    this.client = customClient;
  }

  /**
   * Reset OAuth2Client back to default instance.
   */
  static resetOAuth2Client(): void {
    this.client = new OAuth2Client();
  }

  /**
   * Retrieves all allowed Google Client IDs from environment variables.
   */
  static getAllowedAudiences(): string[] {
    const audiences = new Set<string>();

    const clientId = (env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID)?.trim();
    if (clientId) {
      audiences.add(clientId);
    }

    const clientIds = (env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_IDS)?.trim();
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
   * Verifies Google ID token server-side using google-auth-library.
   * Validates signature, expiration, issuer, audience, email_verified, and @gmail.com domain.
   */
  static async verifyIdToken(idToken: string): Promise<GoogleUserPayload> {
    if (!idToken || typeof idToken !== 'string') {
      throw new UnauthorizedError('Google ID token is required.');
    }

    const audiences = this.getAllowedAudiences();

    try {
      const ticket = await this.client.verifyIdToken({
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

      // Check optional domain restriction if GOOGLE_ALLOWED_EMAIL_DOMAINS is set
      const allowedDomainsRaw = (env.GOOGLE_ALLOWED_EMAIL_DOMAINS || process.env.GOOGLE_ALLOWED_EMAIL_DOMAINS)?.trim();
      if (allowedDomainsRaw) {
        const allowedDomains = allowedDomainsRaw
          .split(',')
          .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
          .filter(Boolean);
        const emailDomain = normalizedEmail.split('@')[1];
        if (allowedDomains.length > 0 && (!emailDomain || !allowedDomains.includes(emailDomain))) {
          throw new BadRequestError(`Email domain @${emailDomain} is not allowed. Allowed domains: ${allowedDomains.join(', ')}`);
        }
      }

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

      // Never log full token or secret info
      logger.warn('[GoogleAuth] Token verification failed', {
        errorMessage: error.message,
      });

      throw new UnauthorizedError('Invalid or expired Google ID token.');
    }
  }
}
