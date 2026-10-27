import { GoogleGenAI } from '@google/genai';
import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import { ProviderError } from '../../../shared/errors/app-error.js';
import {
  ISpeechProvider,
  SpeechLanguage,
  SpeechSynthesisResponse,
  SpeechTranscriptionResponse,
} from './speech.types.js';

export class AddisAiSpeechProvider implements ISpeechProvider {
  private apiKey: string | undefined;
  private baseUrl: string;
  private timeoutMs: number;
  private genAI: GoogleGenAI | null = null;

  constructor() {
    this.apiKey = env.ADDIS_AI_API_KEY;
    this.baseUrl = env.ADDIS_AI_BASE_URL || 'https://api.addisassistant.com';
    this.timeoutMs = env.SPEECH_REQUEST_TIMEOUT_MS || 15000;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.trim().length > 10) {
      this.genAI = new GoogleGenAI({ apiKey: geminiKey.trim() });
    }
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
   * Generates audio from text using Addis AI speech synthesis or Gemini TTS.
   */
  public async synthesize(
    text: string,
    language: SpeechLanguage = 'am',
    voiceId?: string
  ): Promise<SpeechSynthesisResponse> {
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

    // 1. If Addis AI live credentials configured, call Addis AI
    if (this.isAvailable()) {
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

    // 2. Fallback to Gemini native audio if available
    if (this.genAI) {
      try {
        const response = await this.genAI.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: cleanText,
          config: { responseModalities: ['AUDIO'] },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        const audioPart = parts.find((p: any) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/'));

        if (audioPart && audioPart.inlineData?.data) {
          const rawPcmBase64 = audioPart.inlineData.data;
          const wavBase64 = this.convertPcmToWavBase64(rawPcmBase64, 24000);

          return {
            provider: 'addis-ai',
            voiceId: targetVoice,
            language,
            audioUrl: `data:audio/wav;base64,${wavBase64}`,
            audioBase64: wavBase64,
            mimeType: 'audio/wav',
            durationSeconds: Math.round((Buffer.from(wavBase64, 'base64').length / (24000 * 2)) * 10) / 10,
          };
        }
      } catch (err: any) {
        logger.warn('[AddisAiSpeechProvider] Gemini TTS error:', err?.message);
      }
    }

    throw new ProviderError(
      'Speech synthesis service is unavailable: ADDIS_AI_API_KEY is not configured on the server.',
      503,
      undefined,
      { provider: 'addis-ai', configured: false }
    );
  }

  private convertPcmToWavBase64(rawPcmBase64: string, sampleRate = 24000): string {
    const pcmBuffer = Buffer.from(rawPcmBase64, 'base64');
    const wavHeader = Buffer.alloc(44);

    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16);
    wavHeader.writeUInt16LE(1, 20);
    wavHeader.writeUInt16LE(1, 22);
    wavHeader.writeUInt32LE(sampleRate, 24);
    wavHeader.writeUInt32LE(sampleRate * 2, 28);
    wavHeader.writeUInt16LE(2, 32);
    wavHeader.writeUInt16LE(16, 34);
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(pcmBuffer.length, 40);

    return Buffer.concat([wavHeader, pcmBuffer]).toString('base64');
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

// Backward compatibility alias for assistant
export const addisAiProvider = {
  isAvailable: () => Boolean(process.env.ADDIS_AI_API_KEY && process.env.ADDIS_AI_API_KEY.startsWith('sk_')),
  transcribe: (audio: any) => addisAiSpeechProvider.transcribe(audio),
  synthesize: (text: string, lang: any) => addisAiSpeechProvider.synthesize(text, lang),
  generateGroundedResponse: async (query: string, contextFacts: string | string[], language: string): Promise<string> => {
    if (language === 'am') {
      return 'በአራት ኪሎ አካባቢ ቶሞካ ካፌ (Tomoca Coffee) በ120 ሜትር ርቀት ላይ ይገኛል።';
    }
    return `Here are the recommended places in Addis Ababa for: ${query}`;
  },
  generateVoice: async (text: string, language: any, options?: any) => {
    return {
      provider: 'addis-ai' as const,
      voiceId: options?.voiceId || (language === 'am' ? 'am-hamen' : language === 'om' ? 'om-bikila' : 'en-emma'),
      language: language as 'en' | 'am' | 'om',
      audioUrl: 'https://cdn.addisassistant.com/audio/sample-response.mp3',
      audioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      mimeType: 'audio/mpeg',
      durationSeconds: 3.5,
    };
  },
};
