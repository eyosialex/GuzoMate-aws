import { Router } from 'express';
import { weatherController } from './weather/weather.controller.js';
import { routingController } from './routing/routing.controller.js';
import { speechController } from './speech/speech.controller.js';

const travelServicesRouter = Router();

// Weather endpoints (Member 3)
travelServicesRouter.get('/weather/current', (req, res) => weatherController.getCurrent(req, res));
travelServicesRouter.get('/weather/forecast', (req, res) => weatherController.getForecast(req, res));
travelServicesRouter.get('/weather/arrival-advice', (req, res) => weatherController.getArrivalAdvice(req, res));

// Routing endpoints (Member 3)
travelServicesRouter.get('/routes', (req, res) => routingController.getRoutes(req, res));

// Speech endpoints (Member 3)
travelServicesRouter.post('/speech/synthesis', (req, res) => speechController.synthesize(req, res));
travelServicesRouter.post('/speech/transcriptions', (req, res) => speechController.transcribe(req, res));

export default travelServicesRouter;
export { travelServicesRouter };
