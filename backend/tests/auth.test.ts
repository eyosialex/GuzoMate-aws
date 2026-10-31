import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { AfroMessageService } from '../src/services/afroMessage.service.js';

describe('Mechanism B: Phone + Password + OTP Registration & Login', () => {
  const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digits
  const testPhoneLocal = `09${randomSuffix}`; // 10-digit local format: e.g. 0912345678
  const testPhoneE164 = `+2519${randomSuffix}`; // Normalized E.164: +251912345678
  const testPassword = 'Password123!';
  const testFullName = 'Abebe Bikila';

  let activeDevOtp = '';
  let verifiedAuthToken = '';

  afterAll(async () => {
    try {
      await prisma.otpVerification.deleteMany({
        where: { phoneNumber: { in: [testPhoneE164, testPhoneLocal] } },
      });
      await prisma.user.deleteMany({
        where: {
          OR: [
            { phoneNumber: { in: [testPhoneE164, testPhoneLocal] } },
            { fullName: { contains: 'Bikila' } },
          ],
        },
      });
    } catch {
      // Best-effort cleanup
    }
  });

  // ---------------------------------------------------------------------------
  // 1. Registration Field Validations
  // ---------------------------------------------------------------------------
  describe('Registration Validations', () => {
    it('should reject registration when fullName is missing or too short', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        fullName: 'A',
        phoneNumber: testPhoneLocal,
        password: testPassword,
        confirmPassword: testPassword,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(JSON.stringify(res.body.error.details)).toContain('Full name must be at least 2 characters long');
    });

    it('should reject registration with invalid phone number format', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        fullName: testFullName,
        phoneNumber: '12345',
        password: testPassword,
        confirmPassword: testPassword,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(JSON.stringify(res.body.error.details)).toContain('Invalid phone number format');
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        fullName: testFullName,
        phoneNumber: testPhoneLocal,
        password: 'weak',
        confirmPassword: 'weak',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(JSON.stringify(res.body.error.details)).toContain('Password must be at least 8 characters long');
    });

    it('should reject registration when password and confirmPassword do not match', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        fullName: testFullName,
        phoneNumber: testPhoneLocal,
        password: testPassword,
        confirmPassword: 'DifferentPassword456!',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(JSON.stringify(res.body.error.details)).toContain('Passwords do not match');
    });

    it('should successfully register a new user in unverified state (email field ignored/not required)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        fullName: testFullName,
        phoneNumber: testPhoneLocal, // Local 09... format
        password: testPassword,
        confirmPassword: testPassword,
        preferredLanguage: 'en',
        email: 'ignored_local@somedomain.com', // Should be ignored without errors
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.phoneNumber).toBe(testPhoneE164); // Normalized to E.164
      expect(res.body.data.user.fullName).toBe(testFullName);
      expect(res.body.data.user.isPhoneVerified).toBe(false); // Created unverified
      expect(res.body.data.user.authProvider).toBe('local');
      expect(res.body.data.accessToken).toBeUndefined(); // No access token before verification
      expect(res.body.data.devOtp).toBeUndefined(); // OTP is never returned in response

      activeDevOtp = AfroMessageService.getLastSentOtp(testPhoneE164)!;
    });

    it('should update info and resend OTP when re-registering an unverified phone number', async () => {
      // Manually elapse cooldown timestamp in DB so re-register can resend OTP
      await prisma.otpVerification.updateMany({
        where: { phoneNumber: testPhoneE164 },
        data: { resendAvailableAt: new Date(Date.now() - 1000) },
      });

      // Re-register with the same unverified phone but an updated name
      const res = await request(app).post('/api/v1/auth/register').send({
        fullName: 'Abebe Updated Bikila',
        phoneNumber: testPhoneLocal,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe('Abebe Updated Bikila');
      expect(res.body.data.user.isPhoneVerified).toBe(false);
      expect(res.body.data.devOtp).toBeUndefined(); // OTP is never returned in response

      activeDevOtp = AfroMessageService.getLastSentOtp(testPhoneE164)!;
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Unverified User Blocking
  // ---------------------------------------------------------------------------
  describe('Unverified User Restrictions', () => {
    it('should block unverified user from logging in with 403', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        phoneNumber: testPhoneLocal,
        password: 'NewPassword123!',
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Phone number not verified');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. OTP Verification Security Rules
  // ---------------------------------------------------------------------------
  describe('OTP Security Rules', () => {
    it('should reject wrong OTP code and decrement remaining attempts', async () => {
      const res = await request(app).post('/api/v1/auth/verify-otp').send({
        phoneNumber: testPhoneLocal,
        otp: '000000',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid verification code');
    });

    it('should lock out OTP verification after maximum failed attempts', async () => {
      // 4 more wrong attempts (1 already used)
      for (let i = 0; i < 4; i++) {
        await request(app).post('/api/v1/auth/verify-otp').send({
          phoneNumber: testPhoneLocal,
          otp: '000000',
        });
      }

      const res = await request(app).post('/api/v1/auth/verify-otp').send({
        phoneNumber: testPhoneLocal,
        otp: activeDevOtp, // Even with correct code now, it must be locked!
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Too many failed attempts');
    });

    it('should enforce cooldown rate limit on resending OTP (< 60s)', async () => {
      const res = await request(app).post('/api/v1/auth/resend-otp').send({
        phoneNumber: testPhoneLocal,
      });

      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(res.body.error.message).toContain('Please wait');
    });

    it('should allow resending OTP after cooldown and generate fresh code', async () => {
      // Manually elapse cooldown timestamp in DB for test phone
      await prisma.otpVerification.updateMany({
        where: { phoneNumber: testPhoneE164 },
        data: { resendAvailableAt: new Date(Date.now() - 1000) },
      });

      const res = await request(app).post('/api/v1/auth/resend-otp').send({
        phoneNumber: testPhoneLocal,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.devOtp).toBeUndefined(); // OTP is never returned in response
      activeDevOtp = AfroMessageService.getLastSentOtp(testPhoneE164)!;
    });

    it('should reject expired OTP code', async () => {
      // Expire the active code in DB
      await prisma.otpVerification.updateMany({
        where: { phoneNumber: testPhoneE164, isUsed: false },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const res = await request(app).post('/api/v1/auth/verify-otp').send({
        phoneNumber: testPhoneLocal,
        otp: activeDevOtp,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('expired');
    });

    it('should successfully verify OTP, mark user verified, and return JWT', async () => {
      // Issue a fresh OTP
      await prisma.otpVerification.updateMany({
        where: { phoneNumber: testPhoneE164 },
        data: { resendAvailableAt: new Date(Date.now() - 1000) },
      });

      const resendRes = await request(app).post('/api/v1/auth/resend-otp').send({
        phoneNumber: testPhoneLocal,
      });
      expect(resendRes.body.data.devOtp).toBeUndefined(); // OTP is never returned in response
      const freshOtp = AfroMessageService.getLastSentOtp(testPhoneE164)!;

      // Verify with valid code
      const verifyRes = await request(app).post('/api/v1/auth/verify-otp').send({
        phoneNumber: testPhoneLocal,
        otp: freshOtp,
      });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.data.user.isPhoneVerified).toBe(true);
      expect(verifyRes.body.data.accessToken).toBeDefined();

      verifiedAuthToken = verifyRes.body.data.accessToken;

      // Verify single-use: same OTP must be rejected immediately
      const replayRes = await request(app).post('/api/v1/auth/verify-otp').send({
        phoneNumber: testPhoneLocal,
        otp: freshOtp,
      });

      expect(replayRes.status).toBe(400);
      expect(replayRes.body.success).toBe(false);
      expect(replayRes.body.error.message).toContain('already been used');
    });

    it('should reject resend-otp for an already verified user', async () => {
      const res = await request(app).post('/api/v1/auth/resend-otp').send({
        phoneNumber: testPhoneLocal,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('already verified');
    });

    it('should reject registration when phone number is already verified (409 Conflict)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        fullName: 'Another Person',
        phoneNumber: testPhoneLocal,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('already registered and verified');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Phone + Password Login
  // ---------------------------------------------------------------------------
  describe('Phone + Password Login', () => {
    it('should reject login with wrong password using generic error', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        phoneNumber: testPhoneLocal,
        password: 'WrongPassword999!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid credentials');
    });

    it('should reject login for non-existent phone number using generic error', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        phoneNumber: '0900000000',
        password: testPassword,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid credentials');
    });

    it('should successfully login with phone number and password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        phoneNumber: testPhoneLocal,
        password: 'NewPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.phoneNumber).toBe(testPhoneE164);
      expect(res.body.data.user.isPhoneVerified).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return user profile on /auth/me for verified authenticated user', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${verifiedAuthToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.phoneNumber).toBe(testPhoneE164);
      expect(res.body.data.user.isPhoneVerified).toBe(true);
    });

    it('should fail cleanly with generic 401 when Google-only user attempts phone/password login', async () => {
      const googleOnlyPhone = `+25195${Math.floor(1000000 + Math.random() * 9000000)}`;
      await prisma.user.create({
        data: {
          fullName: 'Google User No Password',
          phoneNumber: googleOnlyPhone,
          googleId: `google_only_test_${Date.now()}`,
          passwordHash: null,
          isPhoneVerified: true,
          authProvider: 'google',
        },
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        phoneNumber: googleOnlyPhone,
        password: 'AnyPasswordAttempt123',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid credentials');
    });
  });
});
