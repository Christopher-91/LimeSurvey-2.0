import { AuditService } from './audit.service.js';

export class AuditController {
  static async list(req, res, next) {
    try {
      const { page, limit, action, search, startDate, endDate } = req.query;
      const result = await AuditService.listLogs({
        page,
        limit,
        action,
        search,
        startDate,
        endDate,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async stats(req, res, next) {
    try {
      const stats = await AuditService.getStats();
      return res.status(200).json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}
