import { Router } from 'express';
import { weatherController } from './weather/weather.controller.js';
import { routingController } from './routing/routing.controller.js';
import { speechController } from './speech/speech.controller.js';
import { ne } from 'zod/locales';

const travelServicesRouter = Router();

// Weather endpoints (Member 3)
travelServicesRouter.get('/weather/current', (req, res,next) => weatherController.getCurrent(req, res,next));
travelServicesRouter.get('/weather/forecast', (req, res,next) => weatherController.getForecast(req, res,next));
travelServicesRouter.get('/weather/arrival-advice', (req, res,next) => weatherController.getArrivalAdvice(req, res,next));

// Routing endpoints (Member 3)
travelServicesRouter.get('/routes', (req, res) => routingController.getRoutes(req, res));

// Speech endpoints (Member 3)
travelServicesRouter.post('/speech/synthesis', (req, res,next) => speechController.synthesize(req, res,next));
travelServicesRouter.post('/speech/transcriptions', (req, res,next) => speechController.transcribe(req, res,next));

export default travelServicesRouter;
export { travelServicesRouter };
