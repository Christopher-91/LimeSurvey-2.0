import { Router } from 'express';
import { handleTranslate } from './translate.controller.js';

const router = Router();

// POST /api/v1/translate
router.post('/', handleTranslate);

export default router;
