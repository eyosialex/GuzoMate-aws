import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { OAuth2Client } from 'google-auth-library';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('Mechanism A: Continue with Google (Independent Flow, No Phone Verification)', () => {
  const allowedClientId = 'test-client-id-web.apps.googleusercontent.com';
  const allowedAndroidId = 'test-client-id-android.apps.googleusercontent.com';

  const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
  const googleSubNew = `google_sub_${randomSuffix}_new`;
  const googleEmailNew = `traveler_${randomSuffix}@somedomain.org`; // Non-gmail domain allowed!

  const googleSubExisting = `google_sub_${randomSuffix}_exist`;
  const googleEmailExisting = `existing_${randomSuffix}@company.com`;

  let verifyIdTokenSpy: any;

  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = allowedClientId;
    process.env.GOOGLE_CLIENT_IDS = `${allowedClientId},${allowedAndroidId}`;
    delete process.env.GOOGLE_ALLOWED_EMAIL_DOMAINS;
  });

  beforeEach(() => {
    verifyIdTokenSpy = vi.spyOn(OAuth2Client.prototype, 'verifyIdToken');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { email: { contains: randomSuffix } },
            { googleId: { in: [googleSubNew, googleSubExisting] } },
          ],
        },
      });
    } catch {
      // Best-effort cleanup
    }
  });

  // ---------------------------------------------------------------------------
  // 1. Google Token Verification & Security
  // ---------------------------------------------------------------------------
  describe('Google Token Verification & Security', () => {
    it('should reject request when idToken is missing from body', async () => {
      const res = await request(app).post('/api/v1/auth/google').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 generic error for invalid or expired Google token', async () => {
      verifyIdTokenSpy.mockRejectedValueOnce(new Error('Token used too late, 123456 > 123000'));

      const res = await request(app).post('/api/v1/auth/google').send({
        idToken: 'expired-or-invalid-token',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid or expired Google ID token.');
    });

    it('should reject token with wrong audience (client ID mismatch)', async () => {
      verifyIdTokenSpy.mockImplementationOnce(async ({ audience }: any) => {
        const tokenAudience = 'unauthorized-rogue-client-id';
        const audList = Array.isArray(audience) ? audience : [audience];
        if (!audList.includes(tokenAudience)) {
          throw new Error(`Wrong recipient, payload audience != requiredAudience: ${tokenAudience}`);
        }
        return {
          getPayload: () => ({ sub: '123', email: 'test@somedomain.org', email_verified: true }),
        } as any;
      });

      const res = await request(app).post('/api/v1/auth/google').send({
        idToken: 'wrong-audience-token',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid or expired Google ID token.');
    });

    it('should reject token when email_verified is false', async () => {
      verifyIdTokenSpy.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'google-sub-unverified',
          email: 'unverified@gmail.com',
          email_verified: false,
          name: 'Unverified Google User',
        }),
      } as any);

      const res = await request(app).post('/api/v1/auth/google').send({
        idToken: 'unverified-email-token',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Google account email is not verified.');
    });

    it('should accept non-gmail domain by default (any verified Google account is allowed)', async () => {
      verifyIdTokenSpy.mockResolvedValueOnce({
        getPayload: () => ({
          sub: `google_nongmail_${randomSuffix}`,
          email: `academic_${randomSuffix}@university.edu`,
          email_verified: true,
          name: 'Academic Traveler',
        }),
      } as any);

      const res = await request(app).post('/auth/google').send({
        idToken: 'nongmail-valid-token',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(`academic_${randomSuffix}@university.edu`);
    });

    it('should enforce GOOGLE_ALLOWED_EMAIL_DOMAINS when configured', async () => {
      process.env.GOOGLE_ALLOWED_EMAIL_DOMAINS = 'allowedcompany.com,partner.org';

      verifyIdTokenSpy.mockResolvedValueOnce({
        getPayload: () => ({
          sub: `google_domain_test_${randomSuffix}`,
          email: `user_${randomSuffix}@disallowed.com`,
          email_verified: true,
          name: 'Disallowed Domain User',
        }),
      } as any);

      const res = await request(app).post('/api/v1/auth/google').send({
        idToken: 'disallowed-domain-token',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('is not allowed');

      delete process.env.GOOGLE_ALLOWED_EMAIL_DOMAINS;
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Immediate Full Access with No Phone Verification
  // ---------------------------------------------------------------------------
  describe('Immediate Full Access with No Phone Verification', () => {
    let googleUserAccessToken = '';

    it('should create new Google user and return token without requiring phone verification', async () => {
      verifyIdTokenSpy.mockResolvedValueOnce({
        getPayload: () => ({
          sub: googleSubNew,
          email: googleEmailNew,
          email_verified: true,
          name: 'Independent Google Traveler',
          picture: 'https://lh3.googleusercontent.com/avatar.jpg',
        }),
      } as any);

      // Test alias endpoint /auth/google
      const res = await request(app).post('/auth/google').send({
        idToken: 'valid-token-new-user',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isNewUser).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.requiresPhoneVerification).toBeUndefined(); // Flag removed!

      const user = res.body.data.user;
      expect(user.googleId).toBe(googleSubNew);
      expect(user.email).toBe(googleEmailNew.toLowerCase());
      expect(user.fullName).toBe('Independent Google Traveler');
      expect(user.authProvider).toBe('google');
      expect(user.avatarUrl).toBe('https://lh3.googleusercontent.com/avatar.jpg');

      googleUserAccessToken = res.body.data.accessToken;
    });

    it('should grant immediate full access to protected routes with NO phone verification required', async () => {
      // Google user must NOT be blocked by phone verification middleware
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${googleUserAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.googleId).toBe(googleSubNew);
      expect(res.body.data.user.authProvider).toBe('google');
    });

    it('should log in existing Google user by googleId with immediate access', async () => {
      verifyIdTokenSpy.mockResolvedValueOnce({
        getPayload: () => ({
          sub: googleSubNew,
          email: googleEmailNew,
          email_verified: true,
          name: 'Independent Google Traveler',
          picture: 'https://lh3.googleusercontent.com/avatar.jpg',
        }),
      } as any);

      const res = await request(app).post('/api/v1/auth/google').send({
        idToken: 'valid-token-existing-user',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isNewUser).toBe(false);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.googleId).toBe(googleSubNew);
    });

    it('should NOT merge Google account with local phone account (strictly independent)', async () => {
      // Create a local phone user
      const localPhone = `+25194${Math.floor(1000000 + Math.random() * 9000000)}`;
      await prisma.user.create({
        data: {
          fullName: 'Local Independent User',
          phoneNumber: localPhone,
          isPhoneVerified: true,
          passwordHash: 'somehashedpass',
          authProvider: 'local',
        },
      });

      // Google user with some email signs in
      const independentGoogleSub = `google_indep_${Date.now()}`;
      verifyIdTokenSpy.mockResolvedValueOnce({
        getPayload: () => ({
          sub: independentGoogleSub,
          email: `google_${Date.now()}@gmail.com`,
          email_verified: true,
          name: 'Google Independent Person',
        }),
      } as any);

      const res = await request(app).post('/api/v1/auth/google').send({
        idToken: 'independent-google-token',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.googleId).toBe(independentGoogleSub);
      expect(res.body.data.user.phoneNumber).toBeNull();
      expect(res.body.data.user.authProvider).toBe('google');
    });
  });
});
