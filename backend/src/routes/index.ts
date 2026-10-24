import { Router } from 'express';
import { assistantRouter } from '../modules/assistant/assistant.routes.js';
import { travelServicesRouter } from '../modules/travel-services/travel-services.routes.js';

export const apiRouter = Router();

// Connect active modules
apiRouter.use(assistantRouter);
apiRouter.use(travelServicesRouter);
