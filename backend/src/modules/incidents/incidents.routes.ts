import { Router } from 'express';
import { IncidentsController } from './incidents.controller.js';
import { ConfirmationsController } from '../confirmations/confirmations.controller.js';
import { confirmIncidentSchema } from '../confirmations/confirmations.validation.js';
import {
  createIncidentSchema,
  updateIncidentSchema,
  nearbyIncidentsQuerySchema,
  listIncidentsQuerySchema,
} from './incidents.validation.js';
import { validateRequest } from '../../middleware/request-validation.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware.js';
import { incidentLimiter } from '../../middleware/rate-limit.middleware.js';

const router = Router();

router.post(
  '/',
  authenticate,
  incidentLimiter,
  validateRequest({ body: createIncidentSchema }),
  IncidentsController.createIncident
);

router.get(
  '/nearby',
  validateRequest({ query: nearbyIncidentsQuerySchema }),
  IncidentsController.getNearbyIncidents
);

router.get(
  '/',
  validateRequest({ query: listIncidentsQuerySchema }),
  IncidentsController.listIncidents
);

router.get(
  '/:id',
  optionalAuthenticate,
  IncidentsController.getIncidentById
);

router.post(
  '/:id/confirm',
  authenticate,
  validateRequest({ body: confirmIncidentSchema }),
  ConfirmationsController.voteOnIncident
);

router.patch(
  '/:id',
  authenticate,
  validateRequest({ body: updateIncidentSchema }),
  IncidentsController.updateIncident
);

router.delete(
  '/:id',
  authenticate,
  IncidentsController.deleteIncident
);

export default router;
