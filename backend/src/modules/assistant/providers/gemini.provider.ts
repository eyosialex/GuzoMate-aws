import { GoogleGenAI } from '@google/genai';
import { AppError } from '../dto/errors.js';

export type SupportedLanguage = 'en' | 'am' | 'om';

export interface GeminiGenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

export class GeminiProvider {
  private ai: GoogleGenAI | null = null;
  private defaultModel: string;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.defaultModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  public isAvailable(): boolean {
    return Boolean(
      this.apiKey &&
      this.apiKey !== 'your_gemini_api_key_here' &&
      this.apiKey.trim().length > 5 &&
      this.ai
    );
  }

  /**
   * Generates grounded content with timeout and retry logic.
   */
  public async generateText(
    systemInstruction: string,
    userPrompt: string,
    options: GeminiGenerateOptions = {}
  ): Promise<string> {
    if (!this.ai) {
      throw new AppError(
        'PROVIDER_UNAVAILABLE',
        'Gemini API key is not configured. AI assistant is running in limited mode.',
        503
      );
    }

    const modelName = this.defaultModel;
    const timeoutMs = options.timeoutMs ?? 10000;
    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const generationPromise = this.ai.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: options.temperature ?? 0.2,
            maxOutputTokens: options.maxOutputTokens ?? 1024,
          },
        });

        // Enforce provider timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new AppError('PROVIDER_TIMEOUT', 'Gemini generation timed out.', 504)), timeoutMs)
        );

        const response = await Promise.race([generationPromise, timeoutPromise]);
        const text = response.text;

        if (!text) {
          throw new AppError('PROVIDER_INVALID_RESPONSE', 'Gemini returned an empty response.', 502);
        }

        return text.trim();
      } catch (err: any) {
        attempt++;

        if (err instanceof AppError && err.code === 'PROVIDER_TIMEOUT') {
          if (attempt > maxRetries) throw err;
        } else if (err?.status === 429 || err?.message?.includes('RESOURCE_EXHAUSTED')) {
          if (attempt > maxRetries) {
            throw new AppError('PROVIDER_RATE_LIMITED', 'Gemini rate limit exceeded. Please try again later.', 429);
          }
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        } else if (err instanceof AppError) {
          throw err;
        } else {
          if (attempt > maxRetries) {
            console.error('[GeminiProvider Error]', err);
            throw new AppError(
              'PROVIDER_UNAVAILABLE',
              err?.message || 'External LLM service error.',
              502
            );
          }
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        }
      }
    }

    throw new AppError('PROVIDER_UNAVAILABLE', 'Failed to generate response after retries.', 502);
  }

  /**
   * Task 1 Requirement:
   * Generates a grounded response using strict system instructions:
   * - Answer in the user's requested language ('en', 'am', or 'om').
   * - Use ONLY the facts provided in contextFacts (no hallucinating or guessing).
   * - Explicitly state uncertainty when facts are missing or unverified.
   */
  public async generateGroundedResponse(
    prompt: string,
    contextFacts: string,
    language: SupportedLanguage = 'en'
  ): Promise<string> {
    const languageNames: Record<SupportedLanguage, string> = {
      en: 'English',
      am: 'Amharic (አማርኛ)',
      om: 'Afaan Oromo',
    };

    const targetLangName = languageNames[language] || 'English';

    const systemInstruction = `You are GuzoMate's Multilingual Travel Assistant for Addis Ababa, Ethiopia.
Your mission is to provide accurate, helpful, and culturally respectful travel guidance.

STRICT GROUNDING INSTRUCTIONS:
1. TARGET LANGUAGE: Answer strictly in ${targetLangName}. All conversational prose must be in ${targetLangName}.
2. FACT GROUNDING: Use ONLY the facts explicitly provided in the verified context. Do NOT fabricate, guess, or assume missing details (such as entrance fees, room prices, opening hours, or official safety guarantees).
3. UNCERTAINTY & LIMITATIONS: If specific details requested by the traveler are not present in the provided facts, you MUST explicitly state that they are unverified or currently unavailable in GuzoMate records.
4. ACCURACY: Preserve coordinates, metric distances (meters, kilometers), temperature in Celsius (°C), and proper local place names (e.g., Arat Kilo, Merkato, Piazza, Bole).
5. COMMUNITY REPORTS: Explicitly refer to community-reported road incidents as unverified notices.`;

    const userPrompt = `VERIFIED CONTEXT FACTS:
${contextFacts}

TRAVELER QUERY:
${prompt}

Please answer the traveler's query strictly based on the verified facts above in ${targetLangName}.`;

    return this.generateText(systemInstruction, userPrompt, {
      temperature: 0.2,
      maxOutputTokens: 1024,
      timeoutMs: 8000,
    });
  }
}

export const geminiProvider = new GeminiProvider();

/**
 * Standalone export for generateGroundedResponse
 */
export async function generateGroundedResponse(
  prompt: string,
  contextFacts: string,
  language: SupportedLanguage = 'en'
): Promise<string> {
  return geminiProvider.generateGroundedResponse(prompt, contextFacts, language);
}
