import { Router } from 'express';
import { NotificationsController } from './notifications.controller.js';
import {
  registerDeviceTokenSchema,
  listNotificationsQuerySchema,
} from './notifications.validation.js';
import { validateRequest } from '../../middleware/request-validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Device token registration
router.post(
  '/devices',
  authenticate,
  validateRequest({ body: registerDeviceTokenSchema }),
  NotificationsController.registerDevice
);

router.delete(
  '/devices/:id',
  authenticate,
  NotificationsController.removeDevice
);

// In-app notifications
router.get(
  '/',
  authenticate,
  validateRequest({ query: listNotificationsQuerySchema }),
  NotificationsController.listNotifications
);

router.patch(
  '/read-all',
  authenticate,
  NotificationsController.markAllAsRead
);

router.patch(
  '/:id/read',
  authenticate,
  NotificationsController.markAsRead
);

export default router;
