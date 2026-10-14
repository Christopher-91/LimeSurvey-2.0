import { StatsService } from './stats.service.js';

export class StatsController {
  static async getSurveyStatistics(req, res, next) {
    try {
      const stats = await StatsService.getSurveyStatistics(req.params.surveyId);
      return res.status(200).json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}
