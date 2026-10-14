import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ExportController } from './export.controller.js';

const router = Router();

router.get('/surveys/:surveyId/export', authenticate, requireRole('admin'), ExportController.exportResponses);

export default router;
