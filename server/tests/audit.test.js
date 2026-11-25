import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/db.js';
import { AuditService } from '../src/modules/audit/audit.service.js';

describe('Audit Log Service & Tracking Tests', () => {
  let testAdmin;

  beforeAll(async () => {
    await prisma.$connect();
    testAdmin = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (!testAdmin) {
      testAdmin = await prisma.user.create({
        data: {
          username: 'audit_test_admin',
          email: 'audit_test@limesurvey.local',
          password: 'hashed_password_123',
          fullName: 'Audit Test Administrator',
          role: 'admin',
        },
      });
    }
  });

  afterAll(async () => {
    // Clean up test audit logs
    await prisma.auditLog.deleteMany({
      where: { username: { in: [testAdmin?.username, 'audit_test_admin'] } },
    });
    await prisma.$disconnect();
  });

  it('records an admin LOGIN audit log event with timestamp and IP address', async () => {
    const entry = await AuditService.log({
      userId: testAdmin.id,
      username: testAdmin.username,
      email: testAdmin.email,
      fullName: testAdmin.fullName,
      action: 'LOGIN',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    });

    expect(entry).toBeDefined();
    expect(entry.id).toBeDefined();
    expect(entry.action).toBe('LOGIN');
    expect(entry.username).toBe(testAdmin.username);
    expect(entry.ipAddress).toBe('192.168.1.100');
    expect(entry.timestamp).toBeInstanceOf(Date);
  });

  it('records an admin LOGOUT audit log event with timestamp', async () => {
    const entry = await AuditService.log({
      userId: testAdmin.id,
      username: testAdmin.username,
      email: testAdmin.email,
      fullName: testAdmin.fullName,
      action: 'LOGOUT',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    });

    expect(entry).toBeDefined();
    expect(entry.id).toBeDefined();
    expect(entry.action).toBe('LOGOUT');
    expect(entry.username).toBe(testAdmin.username);
    expect(entry.timestamp).toBeInstanceOf(Date);
  });

  it('filters audit logs by action type (LOGIN and LOGOUT)', async () => {
    const loginLogs = await AuditService.listLogs({ action: 'LOGIN', limit: 10 });
    expect(loginLogs.logs.every((l) => l.action === 'LOGIN')).toBe(true);

    const logoutLogs = await AuditService.listLogs({ action: 'LOGOUT', limit: 10 });
    expect(logoutLogs.logs.every((l) => l.action === 'LOGOUT')).toBe(true);
  });

  it('searches audit logs by username or email keyword', async () => {
    const searchResult = await AuditService.listLogs({ search: testAdmin.username });
    expect(searchResult.logs.length).toBeGreaterThanOrEqual(1);
    expect(searchResult.logs[0].username).toBe(testAdmin.username);
  });

  it('computes accurate audit statistics including logins, logouts, and unique admins', async () => {
    const stats = await AuditService.getStats();
    expect(stats).toBeDefined();
    expect(stats.totalEvents).toBeGreaterThanOrEqual(2);
    expect(stats.totalLogins).toBeGreaterThanOrEqual(1);
    expect(stats.totalLogouts).toBeGreaterThanOrEqual(1);
    expect(stats.uniqueAdminsCount).toBeGreaterThanOrEqual(1);
  });
});
