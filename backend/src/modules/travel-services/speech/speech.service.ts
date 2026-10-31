import { addisAiSpeechProvider } from './addis-ai.provider.js';
import {
  ISpeechProvider,
  SpeechLanguage,
  SpeechSynthesisResponse,
  SpeechTranscriptionResponse,
} from './speech.types.js';

export class SpeechService {
  constructor(private provider: ISpeechProvider = addisAiSpeechProvider) {}

  public isAvailable(): boolean {
    return this.provider.isAvailable();
  }

  public async transcribe(
    audio: string,
    language: SpeechLanguage = 'am',
    options?: { mimeType?: string; format?: string }
  ): Promise<SpeechTranscriptionResponse> {
    return this.provider.transcribe(audio, language, options);
  }

  public async synthesize(
    text: string,
    language: SpeechLanguage = 'am',
    voiceId?: string
  ): Promise<SpeechSynthesisResponse> {
    return this.provider.synthesize(text, language, voiceId);
  }
}

export const speechService = new SpeechService();
