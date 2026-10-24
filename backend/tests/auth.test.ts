import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('Authentication API', () => {
  const testEmail = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
  const testPassword = 'Password123';
  let authToken = '';

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: 'test_' } },
      });
    } catch {
      // Best-effort cleanup
    }
  });

  it('should successfully register a new user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: testEmail,
      password: testPassword,
      name: 'Test Traveler',
      preferredLanguage: 'en',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
    expect(res.body.data.user.role).toBe('USER');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('should reject registration with existing email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: testEmail,
      password: testPassword,
      name: 'Duplicate Traveler',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('should reject registration with weak password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: `weak_${Date.now()}@example.com`,
      password: 'weak',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should successfully login with valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    authToken = res.body.data.accessToken;
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testEmail,
      password: 'WrongPassword999',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return current user profile with valid JWT', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
  });

  it('should reject /auth/me with invalid JWT', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token-string');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
