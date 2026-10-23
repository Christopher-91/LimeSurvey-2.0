import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ResponseController } from './response.controller.js';

const router = Router();

// Submit response (Public or Token-authenticated Voter)
router.post('/surveys/:surveyId/responses', ResponseController.submitResponse);

// Admin view responses (supports ?view=ghost_comments and ?view=attendance)
router.get('/surveys/:surveyId/responses', authenticate, requireRole('admin'), ResponseController.listBySurvey);
router.get('/surveys/:surveyId/ghost-comments', authenticate, requireRole('admin'), ResponseController.getGhostComments);
router.get('/surveys/:surveyId/attendance', authenticate, requireRole('admin'), ResponseController.getAttendance);

export default router;
