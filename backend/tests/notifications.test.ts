import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('Notifications API', () => {
  let userToken = '';
  let userId = '';
  const salt = Math.random().toString(36).substring(7);
  const testEmail = `notif_user_${Date.now()}_${salt}@example.com`;
  const deviceToken = `fcm_token_${Date.now()}_${salt}_test_device_string`;

  beforeAll(async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: testEmail,
      password: 'Password123',
    });
    userToken = res.body.data.accessToken;
    userId = res.body.data.user.id;

    // Create a sample notification directly in DB
    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM_ALERT',
        title: 'Welcome to GuzoMate',
        message: 'Stay safe on the road!',
        isRead: false,
      },
    });
  });

  afterAll(async () => {
    try {
      if (userId) {
        await prisma.deviceToken.deleteMany({ where: { userId } });
        await prisma.notification.deleteMany({ where: { userId } });
        await prisma.user.deleteMany({ where: { id: userId } });
      }
    } catch {
      // Best-effort cleanup
    }
  });

  it('should register a device token', async () => {
    const res = await request(app)
      .post('/api/v1/notifications/devices')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        token: deviceToken,
        platform: 'android',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe(deviceToken);
    expect(res.body.data.isActive).toBe(true);
  });

  it('should list in-app notifications with unread count', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
  });

  it('should mark all notifications as read', async () => {
    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.updatedCount).toBeGreaterThanOrEqual(1);
  });

  it('should deactivate a device token upon removal', async () => {
    const res = await request(app)
      .delete(`/api/v1/notifications/devices/${deviceToken}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.active).toBe(false);
  });
});
