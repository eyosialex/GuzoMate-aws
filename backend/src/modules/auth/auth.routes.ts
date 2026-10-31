import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  googleAuthSchema,
} from './auth.validation.js';
import { validateRequest } from '../../middleware/request-validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authLimiter } from '../../middleware/rate-limit.middleware.js';

const router = Router();

router.post('/register', authLimiter, validateRequest({ body: registerSchema }), AuthController.register);
router.post('/verify-otp', authLimiter, validateRequest({ body: verifyOtpSchema }), AuthController.verifyOtp);
router.post('/resend-otp', authLimiter, validateRequest({ body: resendOtpSchema }), AuthController.resendOtp);
router.post('/login', authLimiter, validateRequest({ body: loginSchema }), AuthController.login);
router.get('/google', AuthController.googleRedirect);
router.get('/google/callback', AuthController.googleCallback);
router.post('/google', authLimiter, validateRequest({ body: googleAuthSchema }), AuthController.googleAuth);
router.get('/me', authenticate, AuthController.getMe);

export default router;
