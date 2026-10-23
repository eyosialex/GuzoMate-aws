import { Router } from 'express';
import { assistantController } from './assistant.controller.js';

export const assistantRouter = Router();

/**
 * POST /api/v1/assistant/query
 * Main entrypoint for multilingual AI assistant queries.
 */
assistantRouter.post('/assistant/query', (req, res) => assistantController.handleQuery(req, res));
