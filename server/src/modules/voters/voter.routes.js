import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { VoterController } from './voter.controller.js';

const router = Router();

router.get('/surveys/:surveyId/voters', authenticate, requireRole('admin'), VoterController.listBySurvey);
router.post('/surveys/:surveyId/voters', authenticate, requireRole('admin'), VoterController.create);
router.patch('/surveys/:surveyId/voters/:id', authenticate, requireRole('admin'), VoterController.update);
router.patch('/voters/:id', authenticate, requireRole('admin'), VoterController.update);
router.post('/surveys/:surveyId/voters/universal', authenticate, requireRole('admin'), VoterController.generateUniversal);
router.post('/surveys/:surveyId/voters/batch', authenticate, requireRole('admin'), VoterController.batchGenerate);
router.delete('/surveys/:surveyId/voters', authenticate, requireRole('admin'), VoterController.deleteAll);
router.delete('/surveys/:surveyId/voters/:id', authenticate, requireRole('admin'), VoterController.delete);
router.delete('/voters/:id', authenticate, requireRole('admin'), VoterController.delete);

export default router;
