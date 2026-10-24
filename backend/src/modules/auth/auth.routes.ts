import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { validateRequest } from '../../middleware/request-validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authLimiter } from '../../middleware/rate-limit.middleware.js';

const router = Router();

router.post('/register', authLimiter, validateRequest({ body: registerSchema }), AuthController.register);
router.post('/login', authLimiter, validateRequest({ body: loginSchema }), AuthController.login);
router.get('/me', authenticate, AuthController.getMe);

export default router;
