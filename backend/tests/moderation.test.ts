import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('Moderation API', () => {
  let userToken = '';
  let modToken = '';
  let incidentId = '';

  const salt = Math.random().toString(36).substring(7);
  const userEmail = `mod_user_${Date.now()}_${salt}@example.com`;
  const modEmail = `mod_staff_${Date.now()}_${salt}@example.com`;

  beforeAll(async () => {
    // Register standard user
    const uRes = await request(app).post('/api/v1/auth/register').send({
      email: userEmail,
      password: 'Password123',
    });
    userToken = uRes.body.data.accessToken;

    // Register moderator user and promote
    const mRes = await request(app).post('/api/v1/auth/register').send({
      email: modEmail,
      password: 'Password123',
    });
    modToken = mRes.body.data.accessToken;

    await prisma.user.update({
      where: { email: modEmail },
      data: { role: 'MODERATOR' },
    });

    // Create incident
    const incRes = await request(app)
      .post('/api/v1/incidents')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'ROAD_BLOCK',
        description: 'Moderation Test: Road closure under bridge',
        severity: 'HIGH',
        lat: 9.02,
        lon: 38.76,
      });

    incidentId = incRes.body.data.id;
  });

  afterAll(async () => {
    try {
      if (incidentId) {
        await prisma.auditLog.deleteMany({ where: { targetId: incidentId } });
        await prisma.incident.deleteMany({ where: { id: incidentId } });
      }
      await prisma.user.deleteMany({ where: { email: { in: [userEmail, modEmail] } } });
    } catch {
      // Best-effort cleanup
    }
  });

  it('should deny non-staff access to moderation review queue', async () => {
    const res = await request(app)
      .get('/api/v1/moderation/incidents')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow moderator to view review queue', async () => {
    const res = await request(app)
      .get('/api/v1/moderation/incidents')
      .set('Authorization', `Bearer ${modToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('should require a reason when rejecting an incident', async () => {
    const res = await request(app)
      .patch(`/api/v1/moderation/incidents/${incidentId}/status`)
      .set('Authorization', `Bearer ${modToken}`)
      .send({
        status: 'REJECTED',
        // missing reason
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should allow moderator to transition status to ACTIVE and audit the change', async () => {
    const res = await request(app)
      .patch(`/api/v1/moderation/incidents/${incidentId}/status`)
      .set('Authorization', `Bearer ${modToken}`)
      .send({
        status: 'ACTIVE',
        reason: 'Verified through local traffic camera feeds',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.verification).toBe('MODERATOR_VERIFIED');
  });

  it('should retrieve moderation history and audit trail', async () => {
    const res = await request(app)
      .get(`/api/v1/moderation/incidents/${incidentId}/history`)
      .set('Authorization', `Bearer ${modToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.history.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.history[0].action).toBe('MODERATION_STATUS_CHANGE');
  });
});
