import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('Users API', () => {
  let userToken = '';
  let adminToken = '';
  const salt = Math.random().toString(36).substring(7);
  const userEmail = `user_test_${Date.now()}_${salt}@example.com`;
  const adminEmail = `admin_test_${Date.now()}_${salt}@example.com`;

  beforeAll(async () => {
    // Register user
    const resUser = await request(app).post('/api/v1/auth/register').send({
      email: userEmail,
      password: 'Password123',
      name: 'Standard User',
    });
    userToken = resUser.body.data.accessToken;

    // Register admin user and promote to ADMIN
    const resAdmin = await request(app).post('/api/v1/auth/register').send({
      email: adminEmail,
      password: 'Password123',
      name: 'Admin User',
    });
    adminToken = resAdmin.body.data.accessToken;

    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' },
    });
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: { in: [userEmail, adminEmail] } },
      });
    } catch {
      // Best-effort cleanup
    }
  });

  it('should get current user profile via /users/me', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(userEmail);
    expect(res.body.data.stats).toBeDefined();
  });

  it('should update user profile name and preferred language', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Updated Name',
        preferredLanguage: 'am',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Name');
    expect(res.body.data.preferredLanguage).toBe('am');
  });

  it('should get and update notification preferences', async () => {
    // Get
    const getRes = await request(app)
      .get('/api/v1/users/me/notification-preferences')
      .set('Authorization', `Bearer ${userToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.enabled).toBe(true);

    // Update
    const patchRes = await request(app)
      .patch('/api/v1/users/me/notification-preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enabled: true,
        radiusMeters: 8000,
        incidentTypes: ['ACCIDENT', 'ROAD_BLOCK'],
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.radiusMeters).toBe(8000);
    expect(patchRes.body.data.incidentTypes).toContain('ROAD_BLOCK');
  });

  it('should deny non-admin access to admin user listing', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow admin to list users', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });
});
