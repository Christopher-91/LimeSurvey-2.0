import { prisma } from '../../config/db.js';

export class AuditService {
  /**
   * Records an audit log event (e.g. admin LOGIN or LOGOUT)
   */
  static async log({
    userId,
    username,
    email,
    fullName,
    action,
    ipAddress,
    userAgent,
    details = null,
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: userId ? parseInt(userId, 10) : null,
          username: username || 'Unknown',
          email: email || null,
          fullName: fullName || null,
          action: (action || 'LOGIN').toUpperCase(),
          ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
          userAgent: userAgent ? String(userAgent).slice(0, 500) : null,
          details: details ? details : undefined,
          timestamp: new Date(),
        },
      });
    } catch (err) {
      // Do not block auth flows if audit logging encounters a transient DB error
      console.error('[AuditService.log] Failed to write audit log:', err);
      return null;
    }
  }

  /**
   * Retrieves paginated audit logs with optional filters
   */
  static async listLogs({
    page = 1,
    limit = 50,
    action,
    search,
    startDate,
    endDate,
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (action && action !== 'ALL') {
      where.action = action.toUpperCase();
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { ipAddress: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  }

  /**
   * Aggregates summary statistics for the audit log dashboard
   */
  static async getStats() {
    const [totalEvents, totalLogins, totalLogouts, recentLogs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { action: 'LOGIN' } }),
      prisma.auditLog.count({ where: { action: 'LOGOUT' } }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    // Unique active admin accounts in logs
    const distinctUsers = await prisma.auditLog.findMany({
      select: { username: true },
      distinct: ['username'],
    });

    return {
      totalEvents,
      totalLogins,
      totalLogouts,
      uniqueAdminsCount: distinctUsers.length,
      lastActivity: recentLogs[0]?.timestamp || null,
      recentLogs,
    };
  }
}
