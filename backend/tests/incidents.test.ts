import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { registerAndVerifyTestUser } from './test-helpers.js';

describe('Incidents API', () => {
  let userToken = '';
  let otherUserToken = '';
  let userEmail = '';
  let otherUserEmail = '';
  let createdIncidentId = '';

  beforeAll(async () => {
    const user1 = await registerAndVerifyTestUser({ name: 'Incident Reporter' });
    userToken = user1.accessToken;
    userEmail = user1.email;

    const user2 = await registerAndVerifyTestUser({ name: 'Other Traveler' });
    otherUserToken = user2.accessToken;
    otherUserEmail = user2.email;
  });

  afterAll(async () => {
    try {
      await prisma.incidentConfirmation.deleteMany();
      await prisma.incident.deleteMany({
        where: { description: { contains: 'Test Incident' } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [userEmail, otherUserEmail] } },
      });
    } catch {
      // Best-effort cleanup
    }
  });

  it('should create an incident report in PENDING status', async () => {
    const res = await request(app)
      .post('/api/v1/incidents')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'ACCIDENT',
        description: 'Test Incident: Minor collision near Stadium',
        severity: 'HIGH',
        lat: 9.0125,
        lon: 38.7534,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('ACCIDENT');
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.verification).toBe('UNVERIFIED');
    expect(res.body.data.location.lat).toBe(9.0125);
    expect(res.body.data.location.lon).toBe(38.7534);

    createdIncidentId = res.body.data.id;
  });

  it('should detect duplicate incident of the same type within 500m', async () => {
    const res = await request(app)
      .post('/api/v1/incidents')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        type: 'ACCIDENT',
        description: 'Test Incident: Another report for stadium crash',
        severity: 'HIGH',
        lat: 9.0126, // within 20 meters
        lon: 38.7535,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_REPORT');
  });

  it('should reject incident with invalid coordinates', async () => {
    const res = await request(app)
      .post('/api/v1/incidents')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'ACCIDENT',
        description: 'Invalid Coords Test',
        lat: 95.0, // Invalid latitude
        lon: 38.75,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should retrieve incident details by ID', async () => {
    const res = await request(app).get(`/api/v1/incidents/${createdIncidentId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdIncidentId);
    expect(res.body.data.confirmationsCount).toBe(0);
    expect(res.body.data.disputesCount).toBe(0);
  });

  it('should perform PostGIS nearby search returning distance in meters', async () => {
    const res = await request(app)
      .get('/api/v1/incidents/nearby')
      .query({
        lat: 9.012,
        lon: 38.753,
        radius: 3000,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);

    const found = res.body.data.items.find((item: any) => item.id === createdIncidentId);
    expect(found).toBeDefined();
    expect(found.distanceMeters).toBeGreaterThan(0);
    expect(found.distanceMeters).toBeLessThan(1000);
  });

  it('should allow reporter to edit own pending incident report', async () => {
    const res = await request(app)
      .patch(`/api/v1/incidents/${createdIncidentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        description: 'Test Incident: Updated collision description',
        severity: 'MEDIUM',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toContain('Updated');
  });

  it('should deny non-reporter ordinary user from editing incident report', async () => {
    const res = await request(app)
      .patch(`/api/v1/incidents/${createdIncidentId}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        description: 'Unauthorized edit attempt',
      });

    expect(res.status).toBe(403);
  });
});
