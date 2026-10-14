import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { StatsController } from './stats.controller.js';

const router = Router();

router.get('/surveys/:surveyId/statistics', authenticate, requireRole('admin'), StatsController.getSurveyStatistics);

export default router;
