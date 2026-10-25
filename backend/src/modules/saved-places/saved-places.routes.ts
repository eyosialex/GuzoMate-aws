import { Router } from 'express';
import { SavedPlacesController } from './saved-places.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// All saved-places routes require user authentication
router.get('/', authenticate, SavedPlacesController.listSavedPlaces);
router.post('/', authenticate, SavedPlacesController.savePlace);
router.delete('/:placeId', authenticate, SavedPlacesController.deleteSavedPlace);

export default router;
