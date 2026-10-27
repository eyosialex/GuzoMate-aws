import { Router } from 'express';
import { weatherController } from './weather/weather.controller.js';
import { routingController } from './routing/routing.controller.js';
import { speechController } from './speech/speech.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware.js';

export const travelServicesRouter = Router();

// =============================================================================
// Weather Endpoints (Member 3)
// =============================================================================
travelServicesRouter.get('/weather/current', (req, res, next) =>
  weatherController.getCurrent(req, res, next)
);

travelServicesRouter.get('/weather/forecast', (req, res, next) =>
  weatherController.getForecast(req, res, next)
);

travelServicesRouter.get('/weather/arrival-advice', (req, res, next) =>
  weatherController.getArrivalAdvice(req, res, next)
);

// =============================================================================
// Routing & Transit Endpoints (Member 3)
// =============================================================================
travelServicesRouter.get('/routes', (req, res, next) =>
  routingController.getRoutes(req, res, next)
);

// =============================================================================
// Speech Services Endpoints (Member 3)
// =============================================================================
// Speech-to-Text: Optional authentication, allows guest voice queries
travelServicesRouter.post('/speech/transcriptions', optionalAuthenticate, (req, res, next) =>
  speechController.transcribe(req, res, next)
);

// Text-to-Speech: Optional authentication, allows guest navigation assistance
travelServicesRouter.post('/speech/synthesis', optionalAuthenticate, (req, res, next) =>
  speechController.synthesize(req, res, next)
);

export default travelServicesRouter;
