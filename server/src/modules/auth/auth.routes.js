import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { loginLimiter } from '../../middleware/rateLimiter.js';
import { validate } from '../../middleware/validate.js';
import { AuthController } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schema.js';

const router = Router();

router.post('/register', loginLimiter, validate(registerSchema), AuthController.register);
router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.get('/refresh', authenticate, AuthController.refresh);

export default router;
