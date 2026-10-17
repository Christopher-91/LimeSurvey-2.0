import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';

describe('Authentication & Role Security Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it('rejects login with missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects login with non-existent admin credentials without leaking details', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      role: 'admin',
      identifier: 'fake_user_12345',
      password: 'wrong_password',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid username/email or password.');
  });

  it('rejects voter login with non-existent token', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      role: 'voter',
      identifier: 'INVALID_TOKEN_9999',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid voter ID, access code or password.');
  });

  it('denies access to protected admin route without authentication', async () => {
    const res = await request(app).get('/api/v1/surveys');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns public surveys without authentication', async () => {
    const res = await request(app).get('/api/v1/surveys/public');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.surveys)).toBe(true);
  });

  it('registers a new administrator account and handles duplicates', async () => {
    const uniqueSuffix = Date.now();
    const testAdmin = {
      username: `admin_${uniqueSuffix}`,
      email: `admin_${uniqueSuffix}@example.com`,
      password: 'StrongPassword123!',
      fullName: 'Test Administrator',
    };

    // First registration should succeed
    const res = await request(app).post('/api/v1/auth/register').send(testAdmin);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe(testAdmin.username);
    expect(res.body.data.role).toBe('admin');
    expect(res.body.data.token).toBeDefined();

    // Duplicate registration with same username should be rejected
    const dupRes = await request(app).post('/api/v1/auth/register').send(testAdmin);
    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);

    // Clean up created test user
    await prisma.user.deleteMany({
      where: { username: testAdmin.username },
    });
  });
});
