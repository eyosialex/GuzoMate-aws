import { GoogleGenAI } from '@google/genai';
import { AppError } from '../dto/errors.js';

export class EmbeddingProvider {
  private ai: GoogleGenAI | null = null;
  private defaultEmbeddingModel: string;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.defaultEmbeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.ai);
  }

  /**
   * Generates a 768-dimensional embedding vector for input text.
   */
  public async embedText(text: string, timeoutMs: number = 5000): Promise<number[]> {
    if (!text || !text.trim()) {
      throw new AppError('VALIDATION_ERROR', 'Cannot generate embedding for empty text.', 400);
    }

    if (!this.ai) {
      throw new AppError(
        'PROVIDER_UNAVAILABLE',
        'Gemini API key is not configured for vector embeddings.',
        503
      );
    }

    try {
      const embedPromise = this.ai.models.embedContent({
        model: this.defaultEmbeddingModel,
        contents: text.trim(),
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new AppError('PROVIDER_TIMEOUT', 'Embedding request timed out.', 504)), timeoutMs)
      );

      const response = await Promise.race([embedPromise, timeoutPromise]);
      const values = response.embeddings?.[0]?.values;

      if (!values || !Array.isArray(values) || values.length === 0) {
        throw new AppError('PROVIDER_INVALID_RESPONSE', 'Invalid embedding response from provider.', 502);
      }

      return values;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (err?.status === 429) {
        throw new AppError('PROVIDER_RATE_LIMITED', 'Embedding rate limit exceeded.', 429);
      }
      throw new AppError('PROVIDER_UNAVAILABLE', err?.message || 'Embedding service unavailable.', 502);
    }
  }

  /**
   * Formats a floating-point array into PostgreSQL pgvector format: '[0.123,0.456,...]'
   */
  public formatVectorForPg(vector: number[]): string {
    return `[${vector.join(',')}]`;
  }
}

export const embeddingProvider = new EmbeddingProvider();
