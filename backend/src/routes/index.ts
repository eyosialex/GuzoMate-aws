import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import incidentsRoutes from '../modules/incidents/incidents.routes.js';
import notificationsRoutes from '../modules/notifications/notifications.routes.js';
import moderationRoutes from '../modules/moderation/moderation.routes.js';
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

export default router;
