import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import incidentsRoutes from '../modules/incidents/incidents.routes.js';
import notificationsRoutes from '../modules/notifications/notifications.routes.js';
import moderationRoutes from '../modules/moderation/moderation.routes.js';
import savedPlacesRoutes from '../modules/saved-places/saved-places.routes.js';
import { assistantRouter } from '../modules/assistant/assistant.routes.js';
import { travelServicesRouter } from '../modules/travel-services/travel-services.routes.js';
import { swaggerDocument } from '../docs/swagger.js';

const router = Router();

// Swagger Documentation UI
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// JSON spec endpoint for Swagger
router.get('/docs.json', (_req, res) => {
  res.json(swaggerDocument);
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/incidents', incidentsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/moderation', moderationRoutes);
router.use('/saved-places', savedPlacesRoutes);
router.use('/assistant', assistantRouter);
router.use('/', travelServicesRouter);

export default router;
