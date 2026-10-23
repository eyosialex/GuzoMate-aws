import { Router } from 'express';
import { assistantController } from './assistant.controller.js';

export const assistantRouter = Router();

/**
 * POST /api/v1/assistant/query
 * Main entrypoint for multilingual AI assistant queries.
 */
assistantRouter.post('/assistant/query', (req, res) => assistantController.handleQuery(req, res));

/**
 * POST /api/v1/speech/synthesis & /api/v1/assistant/speech/synthesis
 * Addis AI Speech synthesis adapter (GuzoMate API Ref Section 8)
 */
assistantRouter.post('/speech/synthesis', (req, res) => assistantController.handleSpeechSynthesis(req, res));
assistantRouter.post('/assistant/speech/synthesis', (req, res) => assistantController.handleSpeechSynthesis(req, res));
