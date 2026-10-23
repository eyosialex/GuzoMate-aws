import { AppError } from '../dto/errors.js';
import { SupportedLanguage } from '../dto/assistant-query.dto.js';

export interface AddisVoiceResult {
  provider: 'addis-ai';
  voiceId: string;
  language: SupportedLanguage;
  audioUrl: string;
  audioBase64?: string;
  mimeType: string;
  durationSeconds?: number;
}

export interface AddisGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface VoiceGenerationOptions {
  voiceId?: string;
  clientRequestId?: string;
  timeoutMs?: number;
}

export class AddisAiProvider {
  private apiKey: string | undefined;
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.ADDIS_AI_API_KEY;
    this.baseUrl = process.env.ADDIS_AI_BASE_URL || 'https://api.addisassistant.com';
    this.defaultModel = process.env.ADDIS_AI_MODEL || 'addis-አሌፍ-፩';
  }

  /**
   * Checks if Addis AI is configured with a valid API key.
   */
  public isAvailable(): boolean {
    return Boolean(
      this.apiKey &&
      this.apiKey.trim().length > 15 &&
      this.apiKey.startsWith('sk_')
    );
  }

  /**
   * Cleans text to prepare it for natural speech synthesis:
   * Removes markdown syntax, source attribution tags, and excess formatting.
   */
  public cleanTextForVoice(rawText: string, maxLength: number = 380): string {
    if (!rawText) return '';

    let text = rawText
      // Remove source citations e.g. [SOURCE: ...]
      .replace(/\[SOURCE:[^\]]+\]/gi, '')
      // Remove URLs
      .replace(/https?:\/\/\S+/gi, '')
      // Remove Markdown headers (#, ##, etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italics
      .replace(/[*_~`]/g, '')
      // Remove bullet marks
      .replace(/^[-*•]\s+/gm, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // If text exceeds maximum comfortable voice length, cut at the last complete sentence
    if (text.length > maxLength) {
      const truncated = text.substring(0, maxLength);
      const lastSentenceEnd = Math.max(
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('።'), // Ethiopic full stop
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('?')
      );

      if (lastSentenceEnd > 80) {
        text = truncated.substring(0, lastSentenceEnd + 1).trim();
      } else {
        text = truncated.trim() + '...';
      }
    }

    return text;
  }

  /**
   * Generates grounded natural language responses based on retrieved database facts.
   * Uses Addis AI chat completions ('addis-አሌፍ-፩').
   */
  public async generateGroundedResponse(
    prompt: string,
    contextFacts: string,
    language: SupportedLanguage = 'en',
    options: AddisGenerateOptions = {}
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new AppError(
        'PROVIDER_UNAVAILABLE',
        'Addis AI API key (ADDIS_AI_API_KEY) is not configured in .env',
        503
      );
    }

    const languageLabels: Record<SupportedLanguage, string> = {
      en: 'English',
      am: 'Amharic (አማርኛ)',
      om: 'Afaan Oromo',
    };

    const targetLangName = languageLabels[language] || 'English';

    const systemInstruction = `You are GuzoMate's Multilingual Travel Assistant for Addis Ababa, Ethiopia.
Your mission is to provide accurate, concise, and culturally respectful guidance.

STRICT GROUNDING INSTRUCTIONS:
1. TARGET LANGUAGE: You MUST respond strictly in ${targetLangName}.
2. FACT GROUNDING: Use ONLY the verified facts provided below. Do NOT fabricate, guess, or assume missing information (e.g. prices, opening hours, safety guarantees).
3. UNCERTAINTY & LIMITATIONS: If details are missing from the facts, state explicitly that they are unverified or currently unavailable in GuzoMate records.
4. ACCURACY: Preserve coordinates, metric units (meters, km), and local landmark names (e.g. Arat Kilo, Mercato, Bole, Piazza).
5. COMMUNITY REPORTS: Explicitly refer to community-reported road incidents as unverified notices.`;

    const userMessage = `VERIFIED CONTEXT FACTS FROM DATABASE:
${contextFacts}

TRAVELER QUERY:
${prompt}

Please answer the traveler's query strictly based on the verified facts above in ${targetLangName}:`;

    const timeoutMs = options.timeoutMs ?? 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'x-api-key': this.apiKey!,
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userMessage },
          ],
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 1024,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new AppError(
          response.status === 429 ? 'PROVIDER_RATE_LIMITED' : 'PROVIDER_UNAVAILABLE',
          `Addis AI returned HTTP ${response.status}: ${errorText}`,
          response.status === 429 ? 429 : 502
        );
      }

      const data = (await response.json()) as any;
      const text = data?.choices?.[0]?.message?.content?.trim();

      if (!text) {
        throw new AppError('PROVIDER_INVALID_RESPONSE', 'Addis AI returned an empty completion.', 502);
      }

      return text;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new AppError('PROVIDER_TIMEOUT', 'Addis AI generation timed out.', 504);
      }
      if (err instanceof AppError) throw err;
      throw new AppError('PROVIDER_UNAVAILABLE', err?.message || 'External Addis AI error.', 502);
    }
  }

  /**
   * Generates high-quality voice audio from text using Addis AI (Addis Voices 2).
   */
  public async generateVoice(
    text: string,
    language: SupportedLanguage = 'en',
    options: VoiceGenerationOptions = {}
  ): Promise<AddisVoiceResult | null> {
    if (!this.isAvailable()) {
      return null;
    }

    const cleanText = this.cleanTextForVoice(text);
    if (!cleanText || cleanText.length < 2) {
      return null;
    }

    // Default voice mapping per supported language
    const defaultVoices: Record<SupportedLanguage, string> = {
      am: 'am-hamen',
      om: 'om-bikila',
      en: 'en-emma',
    };

    const voiceId = options.voiceId || defaultVoices[language] || 'am-hamen';
    const clientRequestId =
      options.clientRequestId ||
      `guzo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const timeoutMs = options.timeoutMs ?? 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/voice/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey!,
        },
        body: JSON.stringify({
          text: cleanText,
          voice_id: voiceId,
          language: language,
          client_request_id: clientRequestId,
          output_format: 'mp3_44100',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errBody = await response.text();
        console.warn(`[AddisAiProvider] Voice generation failed (HTTP ${response.status}):`, errBody);
        return null;
      }

      const resJson = (await response.json()) as any;
      const data = resJson?.data;

      if (!data || !data.audio_url) {
        console.warn('[AddisAiProvider] Voice generation did not return audio_url:', resJson);
        return null;
      }

      return {
        provider: 'addis-ai',
        voiceId: data.voice_id || voiceId,
        language,
        audioUrl: data.audio_url,
        audioBase64: data.audio,
        mimeType: data.mime_type || 'audio/mpeg',
        durationSeconds: data.duration_seconds,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('[AddisAiProvider] Voice generation error (graceful fallback):', err?.message);
      return null;
    }
  }
}

export const addisAiProvider = new AddisAiProvider();
