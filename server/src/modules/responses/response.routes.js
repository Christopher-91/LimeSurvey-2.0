import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ResponseController } from './response.controller.js';

const router = Router();

// Submit response (Public or Token-authenticated Voter)
router.post('/surveys/:surveyId/responses', ResponseController.submitResponse);

// Admin view responses
router.get('/surveys/:surveyId/responses', authenticate, requireRole('admin'), ResponseController.listBySurvey);

export default router;
