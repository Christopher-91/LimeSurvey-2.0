import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { SurveyController } from './survey.controller.js';

const router = Router();

// Public route to view active surveys on the landing page
router.get('/public', SurveyController.listPublic);

// Public or voter survey view
router.get('/:id/take', SurveyController.getById);

// Admin routes
router.get('/', authenticate, requireRole('admin'), SurveyController.listAdmin);
router.post('/', authenticate, requireRole('admin'), SurveyController.create);
router.get('/:id', authenticate, requireRole('admin'), SurveyController.getById);
router.put('/:id', authenticate, requireRole('admin'), SurveyController.update);
router.patch('/:id/toggle-active', authenticate, requireRole('admin'), SurveyController.toggleActive);
router.delete('/:id', authenticate, requireRole('admin'), SurveyController.delete);

export default router;
