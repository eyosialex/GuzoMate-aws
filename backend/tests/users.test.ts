import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { registerAndVerifyTestUser } from './test-helpers.js';

describe('Users API', () => {
  let userToken = '';
  let adminToken = '';
  let userEmail = '';
  let adminEmail = '';

  beforeAll(async () => {
    // Register and verify standard user
    const testUser = await registerAndVerifyTestUser({ name: 'Standard User' });
    userToken = testUser.accessToken;
    userEmail = testUser.email;

    // Register and verify admin user and promote to ADMIN
    const testAdmin = await registerAndVerifyTestUser({ name: 'Admin User' });
    adminToken = testAdmin.accessToken;
    adminEmail = testAdmin.email;

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
