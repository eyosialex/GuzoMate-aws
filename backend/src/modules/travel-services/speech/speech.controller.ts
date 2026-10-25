import { Request, Response } from 'express';
import { speechService } from './speech.service.js';

export class SpeechController {
  public async synthesize(req: Request, res: Response) {
    try {
      const { text, language, voiceId } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'text is required.' });
      }

      const result = await speechService.synthesize(text, language || 'am', voiceId);
      return res.json({ speech: result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public async transcribe(req: Request, res: Response) {
    try {
      // Placeholder for audio transcription
      return res.json({ text: '' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export const speechController = new SpeechController();
