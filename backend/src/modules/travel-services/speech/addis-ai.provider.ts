import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import { ProviderError } from '../../../shared/errors/app-error.js';
import {
  SpeechLanguage,
  SpeechSynthesisResponse,
  SpeechTranscriptionResponse,
} from './speech.types.js';

export interface ISpeechProvider {
  isAvailable(): boolean;
  transcribe(audio: string, language?: SpeechLanguage): Promise<SpeechTranscriptionResponse>;
  synthesize(text: string, language?: SpeechLanguage, voiceId?: string): Promise<SpeechSynthesisResponse>;
}

export class AddisAiSpeechProvider implements ISpeechProvider {
  private apiKey: string | undefined;
  private baseUrl: string;
  private timeoutMs: number;

  constructor() {
    this.apiKey = env.ADDIS_AI_API_KEY;
    this.baseUrl = env.ADDIS_AI_BASE_URL || 'https://api.addisassistant.com';
    this.timeoutMs = env.SPEECH_REQUEST_TIMEOUT_MS || 15000;
  }

  public isAvailable(): boolean {
    return Boolean(
      this.apiKey &&
      this.apiKey.trim().length > 10 &&
      !this.apiKey.includes('replace-with')
    );
  }

  /**
   * Cleans text to prepare it for natural speech synthesis:
   * Removes markdown syntax, source attribution tags, and excess formatting.
   */
  public cleanTextForVoice(rawText: string, maxLength = 400): string {
    if (!rawText) return '';

    let text = rawText
      .replace(/\[SOURCE:[^\]]+\]/gi, '')
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[*_~`]/g, '')
      .replace(/^[-*•]\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length > maxLength) {
      const truncated = text.substring(0, maxLength);
      const lastSentenceEnd = Math.max(
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('።'), // Ethiopic full stop
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('?')
      );

      if (lastSentenceEnd > 60) {
        text = truncated.substring(0, lastSentenceEnd + 1).trim();
      } else {
        text = truncated.trim() + '...';
      }
    }

    return text;
  }

  /**
   * Transcribes audio using Addis AI speech recognition.
   */
  public async transcribe(
    audio: string,
    language: SpeechLanguage = 'am'
  ): Promise<SpeechTranscriptionResponse> {
    if (!this.isAvailable()) {
      throw new ProviderError(
        'Speech-to-text service is unavailable: ADDIS_AI_API_KEY is not configured on the server.',
        503,
        undefined,
        { provider: 'addis-ai', configured: false }
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/speech/transcriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'x-api-key': this.apiKey!,
        },
        body: JSON.stringify({
          audio,
          language,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text();
        throw new ProviderError(
          `Addis AI speech transcription failed (HTTP ${response.status}): ${errText}`,
          response.status === 429 ? 429 : 502
        );
      }

      const data = (await response.json()) as any;
      const text = data?.text || data?.data?.text;

      if (!text) {
        throw new ProviderError('Addis AI returned an empty transcription response.', 502);
      }

      return {
        text,
        language: (data?.language || language) as SpeechLanguage,
        detectedLanguage: data?.detected_language || language,
        confidence: typeof data?.confidence === 'number' ? data.confidence : null,
        provider: 'addis-ai',
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err instanceof ProviderError) throw err;
      if (err.name === 'AbortError') {
        throw new ProviderError('Addis AI transcription request timed out', 504);
      }
      throw new ProviderError(`Speech recognition provider error: ${err.message}`, 502);
    }
  }

  /**
   * Generates audio from text using Addis AI speech synthesis.
   */
  public async synthesize(
    text: string,
    language: SpeechLanguage = 'am',
    voiceId?: string
  ): Promise<SpeechSynthesisResponse> {
    if (!this.isAvailable()) {
      throw new ProviderError(
        'Speech synthesis service is unavailable: ADDIS_AI_API_KEY is not configured on the server.',
        503,
        undefined,
        { provider: 'addis-ai', configured: false }
      );
    }

    const cleanText = this.cleanTextForVoice(text);
    if (!cleanText || cleanText.length === 0) {
      throw new ProviderError('Cleaned text for speech synthesis is empty.', 400);
    }

    const defaultVoices: Record<SpeechLanguage, string> = {
      am: 'am-hamen',
      om: 'om-bikila',
      en: 'en-emma',
    };

    const targetVoice = voiceId || defaultVoices[language] || 'am-hamen';

    // Verify requested voice matches language capability
    if (voiceId && !this.isVoiceCompatible(voiceId, language)) {
      throw new ProviderError(
        `Requested voice '${voiceId}' is not compatible with language '${language}'. Supported: ${defaultVoices[language]}`,
        400
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/voice/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'x-api-key': this.apiKey!,
        },
        body: JSON.stringify({
          text: cleanText,
          voice_id: targetVoice,
          language,
          output_format: 'mp3_44100',
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text();
        throw new ProviderError(
          `Addis AI voice generation failed (HTTP ${response.status}): ${errText}`,
          response.status === 429 ? 429 : 502
        );
      }

      const resJson = (await response.json()) as any;
      const data = resJson?.data || resJson;

      if (!data || (!data.audio_url && !data.audio && !data.audioBase64)) {
        throw new ProviderError('Addis AI did not return a valid audio stream or URL.', 502);
      }

      return {
        provider: 'addis-ai',
        voiceId: data.voice_id || targetVoice,
        language,
        audioUrl: data.audio_url || null,
        audioBase64: data.audio || data.audioBase64 || null,
        mimeType: data.mime_type || 'audio/mpeg',
        durationSeconds: data.duration_seconds || null,
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err instanceof ProviderError) throw err;
      if (err.name === 'AbortError') {
        throw new ProviderError('Addis AI voice generation request timed out', 504);
      }
      throw new ProviderError(`Speech synthesis provider error: ${err.message}`, 502);
    }
  }

  private isVoiceCompatible(voiceId: string, language: SpeechLanguage): boolean {
    const v = voiceId.toLowerCase();
    if (language === 'am') return v.startsWith('am-');
    if (language === 'om') return v.startsWith('om-');
    if (language === 'en') return v.startsWith('en-');
    return true;
  }
}

export const addisAiSpeechProvider = new AddisAiSpeechProvider();
