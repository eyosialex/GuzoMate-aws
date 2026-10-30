import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { registerAndVerifyTestUser } from './test-helpers.js';

describe('Community Verification API', () => {
  let reporterToken = '';
  let voter1Token = '';
  let voter2Token = '';
  let voter3Token = '';
  let incidentId = '';

  const emails: string[] = [];

  beforeAll(async () => {
    const rep = await registerAndVerifyTestUser({ name: 'Reporter' });
    const v1 = await registerAndVerifyTestUser({ name: 'Voter 1' });
    const v2 = await registerAndVerifyTestUser({ name: 'Voter 2' });
    const v3 = await registerAndVerifyTestUser({ name: 'Voter 3' });

    emails.push(rep.email, v1.email, v2.email, v3.email);

    reporterToken = rep.accessToken;
    voter1Token = v1.accessToken;
    voter2Token = v2.accessToken;
    voter3Token = v3.accessToken;

    // Clean up prior test incidents if any remain
    await prisma.incident.deleteMany({
      where: { description: { contains: 'Verification Test' } },
    });

    // Create a pending incident with unique coordinates to avoid duplicate detection collision
    const lat = 9.200 + Math.random() * 0.05;
    const lon = 38.900 + Math.random() * 0.05;

    const incRes = await request(app)
      .post('/api/v1/incidents')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        type: 'FLOODING',
        description: `Verification Test: Water logging ${Date.now()}`,
        severity: 'MEDIUM',
        lat,
        lon,
      });

    if (!incRes.body?.data) {
      console.error('Incident creation failed:', incRes.status, incRes.body);
    }
    incidentId = incRes.body.data.id;
  });

  afterAll(async () => {
    try {
      if (incidentId) {
        await prisma.incidentConfirmation.deleteMany({ where: { incidentId } });
        await prisma.incident.deleteMany({ where: { id: incidentId } });
      }
      if (emails.length > 0) {
        await prisma.user.deleteMany({ where: { email: { in: emails } } });
      }
    } catch {
      // Best-effort cleanup
    }
  });

  it('should prevent the reporter from voting on their own report', async () => {
    const res = await request(app)
      .post(`/api/v1/incidents/${incidentId}/confirm`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({ action: 'CONFIRM' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should allow a distinct user to CONFIRM an incident', async () => {
    const res = await request(app)
      .post(`/api/v1/incidents/${incidentId}/confirm`)
      .set('Authorization', `Bearer ${voter1Token}`)
      .send({ action: 'CONFIRM' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.confirmationsCount).toBe(1);
    expect(res.body.data.disputesCount).toBe(0);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('should reject a duplicate vote of the same action from the same user', async () => {
    const res = await request(app)
      .post(`/api/v1/incidents/${incidentId}/confirm`)
      .set('Authorization', `Bearer ${voter1Token}`)
      .send({ action: 'CONFIRM' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should allow user to change vote to DISPUTE', async () => {
    const res = await request(app)
      .post(`/api/v1/incidents/${incidentId}/confirm`)
      .set('Authorization', `Bearer ${voter1Token}`)
      .send({ action: 'DISPUTE' });

    expect(res.status).toBe(200);
    expect(res.body.data.confirmationsCount).toBe(0);
    expect(res.body.data.disputesCount).toBe(1);
  });

  it('should automatically transition to ACTIVE when reaching 3 confirmations', async () => {
    // Voter 1 switches back to CONFIRM
    await request(app)
      .post(`/api/v1/incidents/${incidentId}/confirm`)
      .set('Authorization', `Bearer ${voter1Token}`)
      .send({ action: 'CONFIRM' });

    // Voter 2 confirms
    await request(app)
      .post(`/api/v1/incidents/${incidentId}/confirm`)
      .set('Authorization', `Bearer ${voter2Token}`)
      .send({ action: 'CONFIRM' });

    // Voter 3 confirms (3rd confirmation)
    const res = await request(app)
      .post(`/api/v1/incidents/${incidentId}/confirm`)
      .set('Authorization', `Bearer ${voter3Token}`)
      .send({ action: 'CONFIRM' });

    expect(res.status).toBe(200);
    expect(res.body.data.confirmationsCount).toBe(3);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.verification).toBe('COMMUNITY_CONFIRMED');
  });
});
