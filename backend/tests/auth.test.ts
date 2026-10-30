import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('Authentication API — Phone & Gmail OTP System', () => {
  const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digits
  const testPhoneLocal = `09${randomSuffix}`; // 10-digit local format: e.g. 0912345678
  const testPhoneE164 = `+2519${randomSuffix}`; // Normalized E.164: +251912345678
  const testEmail = `test_${Date.now()}_${randomSuffix}@gmail.com`;
  const testPassword = 'Password123';

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
            { email: { contains: 'test_' } },
            { phoneNumber: { in: [testPhoneE164, testPhoneLocal] } },
          ],
        },
      });
    } catch {
      // Best-effort cleanup
    }
  });

  // ---------------------------------------------------------------------------
  // 1. Registration Validation
  // ---------------------------------------------------------------------------
  it('should reject registration with non-gmail email address', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'traveler@yahoo.com',
      phoneNumber: testPhoneLocal,
      password: testPassword,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(res.body.error.details)).toContain('Only @gmail.com email addresses are allowed.');
  });

  it('should reject registration with invalid phone number format', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: `valid_${Date.now()}@gmail.com`,
      phoneNumber: '12345',
      password: testPassword,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(res.body.error.details)).toContain('Invalid phone number format');
  });

  it('should reject registration with weak password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: `weak_${Date.now()}@gmail.com`,
      phoneNumber: testPhoneLocal,
      password: 'weak',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should successfully register a new user in unverified state and dispatch OTP', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: testEmail,
      phoneNumber: testPhoneLocal, // Local 09... format
      password: testPassword,
      name: 'Test Traveler',
      preferredLanguage: 'en',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
    expect(res.body.data.user.phoneNumber).toBe(testPhoneE164); // Normalized to E.164
    expect(res.body.data.user.isPhoneVerified).toBe(false); // Created unverified
    expect(res.body.data.user.role).toBe('USER');
    expect(res.body.data.accessToken).toBeUndefined(); // No access token before verification
    expect(res.body.data.devOtp).toBeDefined(); // Dev OTP exposed in test environment

    activeDevOtp = res.body.data.devOtp;
  });

  it('should reject registration with duplicate email', async () => {
    const anotherPhone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
    const res = await request(app).post('/api/v1/auth/register').send({
      email: testEmail,
      phoneNumber: anotherPhone,
      password: testPassword,
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.message).toContain('email');
  });

  it('should reject registration with duplicate phone number', async () => {
    const anotherEmail = `diff_${Date.now()}@gmail.com`;
    const res = await request(app).post('/api/v1/auth/register').send({
      email: anotherEmail,
      phoneNumber: testPhoneE164,
      password: testPassword,
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.message).toContain('phone number');
  });

  // ---------------------------------------------------------------------------
  // 2. Unverified User Blocking
  // ---------------------------------------------------------------------------
  it('should block unverified user from logging in', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      phoneNumber: testPhoneLocal,
      password: testPassword,
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Phone number not verified');
  });

  // ---------------------------------------------------------------------------
  // 3. OTP Verification Security Rules
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // 4. OTP Resend & Rate Limiting
  // ---------------------------------------------------------------------------
  it('should enforce cooldown rate limit on resending OTP (< 60s)', async () => {
    // The previous OTP was created recently, so cooldown is active
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
    expect(res.body.data.devOtp).toBeDefined();
    activeDevOtp = res.body.data.devOtp;
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

  // ---------------------------------------------------------------------------
  // 5. Successful OTP Verification & Single-Use Check
  // ---------------------------------------------------------------------------
  it('should successfully verify OTP, mark user verified, and return JWT', async () => {
    // Issue a fresh OTP
    await prisma.otpVerification.updateMany({
      where: { phoneNumber: testPhoneE164 },
      data: { resendAvailableAt: new Date(Date.now() - 1000) },
    });

    const resendRes = await request(app).post('/api/v1/auth/resend-otp').send({
      phoneNumber: testPhoneLocal,
    });
    const freshOtp = resendRes.body.data.devOtp;

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
  });

  it('should reject resend-otp for an already verified user', async () => {
    const res = await request(app).post('/api/v1/auth/resend-otp').send({
      phoneNumber: testPhoneLocal,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('already verified');
  });

  // ---------------------------------------------------------------------------
  // 6. Login Flow (Phone + Password Only)
  // ---------------------------------------------------------------------------
  it('should reject login with wrong password using generic error', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      phoneNumber: testPhoneLocal,
      password: 'WrongPassword999',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid credentials');
  });

  it('should reject login for non-existent phone number using generic error', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      phoneNumber: '0999999999',
      password: testPassword,
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid credentials');
  });

  it('should successfully login with phone number and password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      phoneNumber: testPhoneLocal,
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.phoneNumber).toBe(testPhoneE164);
    expect(res.body.data.user.isPhoneVerified).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 7. Protected Route Access (/auth/me)
  // ---------------------------------------------------------------------------
  it('should return user profile on /auth/me for verified authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${verifiedAuthToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
    expect(res.body.data.user.phoneNumber).toBe(testPhoneE164);
    expect(res.body.data.user.isPhoneVerified).toBe(true);
  });

  it('should reject /auth/me with invalid JWT token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.payload');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
