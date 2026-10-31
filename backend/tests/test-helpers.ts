import request from 'supertest';
import { app } from '../src/app.js';
import { AfroMessageService } from '../src/services/afroMessage.service.js';

export interface TestUserOptions {
  email?: string;
  phoneNumber?: string;
  password?: string;
  name?: string;
  preferredLanguage?: 'en' | 'am' | 'om';
}

/**
 * Helper to register and verify a user for test suites.
 */
export async function registerAndVerifyTestUser(options: TestUserOptions = {}) {
  const salt = Math.floor(10000000 + Math.random() * 90000000).toString();
  const email = options.email || `test_${Date.now()}_${salt}@gmail.com`;
  const phoneNumber = options.phoneNumber || `09${salt}`;
  const password = options.password || 'Password123';

  const regRes = await request(app).post('/api/v1/auth/register').send({
    email,
    phoneNumber,
    password,
    name: options.name || 'Test User',
    preferredLanguage: options.preferredLanguage || 'en',
  });

  const normalizedPhone = regRes.body.data?.user?.phoneNumber || phoneNumber;
  const otp = AfroMessageService.getLastSentOtp(normalizedPhone) || AfroMessageService.getLastSentOtp();
  if (!otp) {
    throw new Error(`Failed to retrieve dispatched OTP for test user: ${JSON.stringify(regRes.body)}`);
  }

  const verifyRes = await request(app).post('/api/v1/auth/verify-otp').send({
    phoneNumber,
    otp,
  });

  if (!verifyRes.body.data?.accessToken) {
    throw new Error(`Failed to verify test user: ${JSON.stringify(verifyRes.body)}`);
  }

  return {
    user: verifyRes.body.data.user,
    accessToken: verifyRes.body.data.accessToken as string,
    email,
    phoneNumber,
    password,
  };
}
