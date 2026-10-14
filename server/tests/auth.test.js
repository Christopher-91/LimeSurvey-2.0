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
});
