import { Router } from 'express';
import { UsersController } from './users.controller.js';
import {
  updateProfileSchema,
  updateNotificationPreferencesSchema,
  adminUpdateUserSchema,
  listUsersQuerySchema,
} from './users.validation.js';
import { validateRequest } from '../../middleware/request-validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// Profile endpoints
router.get('/me', authenticate, UsersController.getMe);
router.patch('/me', authenticate, validateRequest({ body: updateProfileSchema }), UsersController.updateMe);

// Notification preferences endpoints
router.get('/me/notification-preferences', authenticate, UsersController.getNotificationPreferences);
router.patch(
  '/me/notification-preferences',
  authenticate,
  validateRequest({ body: updateNotificationPreferencesSchema }),
  UsersController.updateNotificationPreferences
);

// Admin-only user management
router.get(
  '/',
  authenticate,
  requireRole([UserRole.ADMIN]),
  validateRequest({ query: listUsersQuerySchema }),
  UsersController.listUsers
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole([UserRole.ADMIN]),
  validateRequest({ body: adminUpdateUserSchema }),
  UsersController.adminUpdateUser
);

export default router;
