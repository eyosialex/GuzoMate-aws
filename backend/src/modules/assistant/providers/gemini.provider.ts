import { GoogleGenAI, Type } from '@google/genai';
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
    this.defaultModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
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
5. places.scope & radiusMeters (NEARBY-FIRST PROGRESSIVE EXPANSION):
   - DEFAULT TO NEARBY FIRST: When User Current Location is provided, ALWAYS prioritize "local" (radiusMeters: 2500-3000m) so the traveler sees what is closest to them first.
   - WIDER / EXPANDED SEARCH: If the user indicates they want MORE/OTHER options, are UNSATISFIED with immediate nearby places, or ask for places further away (e.g. "any other options?", "further away", "outside this area", "show me more", "something else", "not these", "expand search"), expand to "neighborhood" (radiusMeters: 6000-8000m).
   - CITY-WIDE: Set scope to "city_wide" (radiusMeters: 15000m) ONLY if:
     a) The traveler explicitly asks for "anywhere", "all over Addis", "across the whole city", OR
     b) In recent conversation history, the traveler has already received both local and neighborhood recommendations and wants wider options across the city, OR
     c) No current location is provided.
6. Concise extraction rules:
   - routes.origin and routes.destination: Extract ONLY a concise Latin transliterated place name (1 to 3 words, e.g. "Bole", "Merkato", "Arat Kilo", "Piassa", "Gerji"). Do NOT include punctuation, explanations, or repetitive synonyms.
   - places.destination: Extract a concise Latin place name if mentioned, or null.
7. weather.needed: true if the user asks about weather, rain, forecast, temperature, or arrival conditions. weather.arrivalTime: short time string (e.g. "14:30", "in 1 hour", "now") or null.
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

    const retrievalSchema = {
      type: Type.OBJECT,
      properties: {
        language: { type: Type.STRING, enum: ['en', 'am', 'om'] },
        intents: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            enum: ['PLACES', 'WEATHER', 'ROUTING', 'INCIDENTS'],
          },
        },
        places: {
          type: Type.OBJECT,
          properties: {
            needed: { type: Type.BOOLEAN },
            categories: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            destination: { type: Type.STRING },
            scope: { type: Type.STRING, enum: ['local', 'neighborhood', 'city_wide'] },
            radiusMeters: { type: Type.NUMBER },
          },
          required: ['needed', 'categories', 'keywords', 'scope', 'radiusMeters'],
        },
        weather: {
          type: Type.OBJECT,
          properties: {
            needed: { type: Type.BOOLEAN },
            arrivalTime: { type: Type.STRING },
          },
          required: ['needed'],
        },
        routes: {
          type: Type.OBJECT,
          properties: {
            needed: { type: Type.BOOLEAN },
            origin: { type: Type.STRING },
            destination: { type: Type.STRING },
          },
          required: ['needed'],
        },
        incidents: {
          type: Type.OBJECT,
          properties: {
            needed: { type: Type.BOOLEAN },
          },
          required: ['needed'],
        },
      },
      required: ['language', 'intents', 'places', 'weather', 'routes', 'incidents'],
    };

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
            responseSchema: retrievalSchema,
            temperature: 0.1,
            maxOutputTokens: 1200,
          },
        });
        clearTimeout(timeout);

        let jsonText = response.text?.trim() || '';
        if (jsonText) {
          // Remove Markdown code block wrappers if any
          if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
          }
          const firstBrace = jsonText.indexOf('{');
          const lastBrace = jsonText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
            jsonText = jsonText.slice(firstBrace, lastBrace + 1);
          }

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
Your mission is to provide accurate, helpful, flexible, conversational, and culturally respectful travel guidance.
DO NOT PROVIDE MARKDOWN ANSWER. USE PLAIN TEXT.
HELPFUL & FLEXIBLE ASSISTANT GUIDELINES:
1. NATURAL & HUMAN-FRIENDLY CONVERSATION:
   - Speak naturally like a knowledgeable, warm, and courteous local travel friend.
   - For greetings, pleasantries, or general chat (e.g. "hi", "how are you", "who are you", "thanks"), respond warmly and naturally. Introduce yourself as GuzoMate, and offer your help with directions, city exploration, weather, or places.
   - Do NOT say robotic phrases like "Based on the verified context facts provided" or "Here is your grounded response". Speak naturally, smoothly, and authoritatively.
2. TARGET LANGUAGE: Answer strictly in ${targetLangName}. All conversational prose must be in ${targetLangName}.
3. WELCOMING & HELPFUL RECOMMENDATIONS:
   - Be friendly, flexible, and encouraging.
   - When a traveler asks for recommendations, leisure spots, or a place to relax (near them or anywhere in Addis Ababa), provide warm, practical suggestions. Consider green parks (Unity Park, Friendship Park, Entoto Park), scenic spots, peaceful cafes (Tomoca, Haset, etc.), and local dining.
4. SENSE OF URGENCY:
   - If the traveler is in an emergency or in a hurry (e.g. searching for a hospital, clinic, emergency pharmacy, or fuel), provide immediate, concise, direct answers with distance and location first.
5. NEARBY-FIRST PRESENTATION & PROGRESSIVE EXPANSION:
   - When places are provided in the context, present the closest nearby options first with their estimated distances (e.g., "about 120 meters away").
   - If they are exploring locally, politely let them know they can ask to explore further out or across other subcities.
6. HONESTY & ACCURACY:
   - Do not fabricate fake phone numbers or non-existent ticket prices.
   - Preserve metric distances (meters, kilometers), temperature in Celsius (°C), and proper local place names (e.g., Arat Kilo, Merkato, Piazza, Bole, Kazanchis, Entoto).
7. COMMUNITY REPORTS & WEATHER:
   - Mention road hazards or traffic incidents as live community updates.
   - When weather is relevant, describe conditions and give practical advice (e.g., bringing an umbrella or jacket).`;

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
