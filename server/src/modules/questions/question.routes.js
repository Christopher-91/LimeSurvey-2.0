import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { QuestionController } from './question.controller.js';

const router = Router({ mergeParams: true });

router.post('/surveys/:surveyId/questions', authenticate, requireRole('admin'), QuestionController.addQuestion);
router.put('/questions/:id', authenticate, requireRole('admin'), QuestionController.updateQuestion);
router.delete('/questions/:id', authenticate, requireRole('admin'), QuestionController.deleteQuestion);

export default router;
