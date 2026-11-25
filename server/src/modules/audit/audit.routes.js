import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { AuditController } from './audit.controller.js';

const router = Router();

router.get('/', authenticate, requireRole('admin', 'superadmin'), AuditController.list);
router.get('/stats', authenticate, requireRole('admin', 'superadmin'), AuditController.stats);

export default router;
