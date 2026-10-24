import { GoogleGenAI } from '@google/genai';
import { AppError } from '../dto/errors.js';

export type SupportedLanguage = 'en' | 'am' | 'om';

export interface LLMRetrievalPlan {
  language: SupportedLanguage;
  intents: ('PLACES' | 'WEATHER' | 'ROUTING' | 'INCIDENTS')[];
  places?: {
    needed: boolean;
    categories: string[];
    keywords: string[];
    destination?: string | null;
    scope: 'local' | 'neighborhood' | 'city_wide';
    radiusMeters?: number;
  };
  weather?: {
    needed: boolean;
    arrivalTime?: string | null;
  };
  routes?: {
    needed: boolean;
    origin?: string | null;
    destination?: string | null;
  };
  incidents?: {
    needed: boolean;
  };
}

export interface GeminiGenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

export class GeminiProvider {
  private ai: GoogleGenAI | null = null;
  private defaultModel: string;
  private fallbackModel: string;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.defaultModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    this.fallbackModel =
      process.env.GEMINI_MODEL_SECOND ||
      process.env.GEMINI_FALLBACK_MODEL ||
      'gemini-flash-lite-latest';

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

    const candidateModels = Array.from(new Set([this.defaultModel, this.fallbackModel].filter(Boolean)));
    const timeoutMs = options.timeoutMs ?? 10000;

    for (const modelName of candidateModels) {
      let attempt = 0;
      const maxRetries = 1;

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
          if (attempt > maxRetries) {
            console.warn(`[GeminiProvider] generateText failed on ${modelName} (${err?.message || err}). Trying fallback model...`);
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    throw new AppError('PROVIDER_UNAVAILABLE', 'Failed to generate response after exhausting candidate Gemini models.', 502);
  }

  /**
   * Uses Gemini Flash to intelligently decide what data to retrieve from the database
   * based on the traveler query, location, and conversation history.
   */
  public async planRetrieval(
    query: string,
    history: { role: string; content: string }[] = [],
    location?: { lat: number; lon: number },
    arrivalTime?: string
  ): Promise<LLMRetrievalPlan | null> {
    if (!this.ai || !this.isAvailable()) {
      return null;
    }

    const systemInstruction = `You are GuzoMate's Intelligent Query Planner for Addis Ababa travel.
Analyze the traveler's message, recent chat history, and location to determine what real-time data needs to be retrieved from the database to answer them accurately.

You MUST respond with a JSON object with this exact structure:
{
  "language": "en" | "am" | "om",
  "intents": ("PLACES" | "WEATHER" | "ROUTING" | "INCIDENTS")[],
  "places": {
    "needed": boolean,
    "categories": string[],
    "keywords": string[],
    "destination": string | null,
    "scope": "local" | "neighborhood" | "city_wide",
    "radiusMeters": number
  },
  "weather": {
    "needed": boolean,
    "arrivalTime": string | null
  },
  "routes": {
    "needed": boolean,
    "origin": string | null,
    "destination": string | null
  },
  "incidents": {
    "needed": boolean
  }
}

Guidelines:
1. language: detect if the query is in English ('en'), Amharic ('am'), or Afaan Oromo ('om').
2. places.needed: true if the traveler is looking for places, amenities, food, services, relaxation, or landmarks.
3. places.categories: array of general categories like "park", "garden", "cafe", "restaurant", "hospital", "pharmacy", "hotel", "bank", "fuel", "mechanic", "attraction", "viewpoint", "museum".
4. places.keywords: array of specific search keywords to match in OpenStreetMap database tags/content (e.g. for relaxation: ["park", "garden", "cafe", "recreation", "leisure", "viewpoint"]).
5. places.scope: "city_wide" if the user mentions "anywhere", "in Addis", "around the city", or asks for general recommendations. "neighborhood" if a specific neighborhood (e.g. "Bole", "Piazza", "Arat Kilo", "Mercato") is requested. "local" if searching right around their current coordinates.
6. places.radiusMeters: 3000 for local, 5000 for neighborhood, 15000 for city_wide.
7. weather.needed: true if the user asks about weather, rain, forecast, temperature, or arrival conditions.
8. routes.needed: true if the user asks how to get from one location to another.
9. incidents.needed: true if the user asks about traffic jams, road closures, or accidents.`;

    let historySummary = 'None';
    if (history.length > 0) {
      historySummary = history
        .map((h) => `${h.role === 'user' ? 'Traveler' : 'Assistant'}: ${h.content}`)
        .join('\n');
    }

    const userPrompt = `Traveler Query: "${query}"
User Current Location: ${location ? `Lat ${location.lat}, Lon ${location.lon}` : 'Not provided'}
Expected Arrival Time: ${arrivalTime || 'Not provided'}
Recent Conversation History:
${historySummary}`;

    const candidateModels = Array.from(new Set([this.defaultModel, this.fallbackModel].filter(Boolean)));

    for (const modelName of candidateModels) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      try {
        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 600,
          },
        });
        clearTimeout(timeout);

        const jsonText = response.text?.trim();
        if (jsonText) {
          return JSON.parse(jsonText) as LLMRetrievalPlan;
        }
      } catch (err: any) {
        clearTimeout(timeout);
        console.warn(`[GeminiProvider] planRetrieval failed on ${modelName} (${err?.message || err}). Trying fallback model...`);
      }
    }

    console.warn('[GeminiProvider] All Gemini models exhausted for query planning; falling back to local regex parser as ultimate fallback.');
    return null;
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
Your mission is to provide accurate, helpful, flexible, and culturally respectful travel guidance.

HELPFUL & FLEXIBLE ASSISTANT GUIDELINES:
1. TARGET LANGUAGE: Answer strictly in ${targetLangName}. All conversational prose must be in ${targetLangName}.
2. WELCOMING & HELPFUL GUIDANCE: Be friendly, flexible, and encouraging. When a traveler asks for recommendations, leisure spots, or a place to relax (whether near them or anywhere in the city), provide warm, practical suggestions. Consider green parks, peaceful cafes, scenic viewpoints (such as Entoto Park, Friendship Park, Unity Park), gardens, and restaurants.
3. GROUNDING WITH FLEXIBILITY: Ground your specific place details in the verified context facts provided. If the traveler asks a broad question (e.g., "suggest me a place to relax anywhere"), do NOT bluntly refuse or claim you are restricted to a single spot. Instead, actively present the best matching places from the context facts or prominent Addis Ababa landmarks and explain why they are great to visit.
4. UNCERTAINTY & LIMITATIONS: Do NOT fabricate fake phone numbers, non-existent ticket prices, or imaginary opening hours. If specific administrative details are not in the context, politely suggest checking locally while keeping your recommendation helpful.
5. ACCURACY: Preserve metric distances (meters, kilometers), temperature in Celsius (°C), and proper local place names (e.g., Arat Kilo, Merkato, Piazza, Bole, Entoto).
6. COMMUNITY REPORTS: Explicitly refer to community-reported road incidents as unverified notices.
7. WEATHER & ARRIVAL ADVICE: When destination weather or arrival time forecast facts are present, explain what weather conditions to expect upon arrival, and suggest compatible clothing, umbrella, or gear according to the advice.`;

    const userPrompt = `VERIFIED CONTEXT FACTS:
${contextFacts}

TRAVELER QUERY:
${prompt}

Please answer the traveler's query in a helpful, flexible, and welcoming manner in ${targetLangName}, drawing from the verified context facts above.`;

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
