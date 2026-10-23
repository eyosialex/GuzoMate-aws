import { GoogleGenAI } from '@google/genai';
import { AppError } from '../dto/errors.js';

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
    return Boolean(this.apiKey && this.ai);
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

        // If it's our own AppError timeout, don't retry if retries exhausted
        if (err instanceof AppError && err.code === 'PROVIDER_TIMEOUT') {
          if (attempt > maxRetries) throw err;
        } else if (err?.status === 429 || err?.message?.includes('RESOURCE_EXHAUSTED')) {
          if (attempt > maxRetries) {
            throw new AppError('PROVIDER_RATE_LIMITED', 'Gemini rate limit exceeded. Please try again later.', 429);
          }
          // Exponential backoff
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
}

export const geminiProvider = new GeminiProvider();
