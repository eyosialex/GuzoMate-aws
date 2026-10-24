import { Router } from 'express';
import { ModerationController } from './moderation.controller.js';
import {
  updateIncidentStatusSchema,
  listModerationIncidentsQuerySchema,
} from './moderation.validation.js';
import { validateRequest } from '../../middleware/request-validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All moderation routes require MODERATOR or ADMIN role
router.use(authenticate, requireRole([UserRole.MODERATOR, UserRole.ADMIN]));

router.get(
  '/incidents',
  validateRequest({ query: listModerationIncidentsQuerySchema }),
  ModerationController.listIncidents
);

router.patch(
  '/incidents/:id/status',
  validateRequest({ body: updateIncidentStatusSchema }),
  ModerationController.updateStatus
);

router.get(
  '/incidents/:id/history',
  ModerationController.getHistory
);

export default router;
