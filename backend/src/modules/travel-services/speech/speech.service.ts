import { addisAiProvider, AddisAiProvider, AddisVoiceResult } from './addis-ai.provider.js';
import { SupportedLanguage } from '../../assistant/dto/assistant-query.dto.js';

export class SpeechService {
  constructor(private provider: AddisAiProvider = addisAiProvider) {}

  public async synthesize(
    text: string,
    language: SupportedLanguage = 'am',
    voiceId?: string
  ): Promise<AddisVoiceResult | null> {
    return this.provider.generateVoice(text, language, { voiceId });
  }

  public async transcribe(audioBuffer: Buffer, language?: SupportedLanguage): Promise<{ text: string }> {
    // Placeholder for STT integration
    return { text: '' };
  }
}

export const speechService = new SpeechService();
