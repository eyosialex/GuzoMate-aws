import { AssistantQueryDto, SupportedLanguage } from './dto/assistant-query.dto.js';
import { AssistantQueryResponse, AddisVoiceResult } from './dto/assistant-response.dto.js';
import { intentService } from './intent/intent.service.js';
import { SecurityGuards } from './rag/guards.js';
import { ragService } from './rag/rag.service.js';
import { addisAiProvider } from './providers/addis-ai.provider.js';

export class AssistantService {
  /**
   * Main entrypoint for processing assistant queries.
   */
  public async query(input: AssistantQueryDto): Promise<AssistantQueryResponse> {
    // 1. Sanitize user input against prompt injection
    const sanitizedQuery = SecurityGuards.sanitizeQuery(input.query);

    // 2. Detect language, intent (PLACES, WEATHER, ROUTING, INCIDENTS, COMPOSITE) and extract entities
    const analysis = intentService.analyze(
      sanitizedQuery,
      input.language,
      input.location,
      input.arrivalTime
    );

    // 3. Execute RAG pipeline: gather facts from DB, format structured context, call LLM (Addis AI / Gemini)
    const result = await ragService.executePipeline(
      sanitizedQuery,
      analysis,
      input.location
    );

    // 4. Clean answer and assemble final response
    const cleanedAnswer = SecurityGuards.validateAnswer(result.answer);

    // 5. Generate voice response via Addis AI (when enabled and available)
    let voice: AddisVoiceResult | null = null;
    const voiceRequested = input.enableVoice !== false;

    if (voiceRequested && addisAiProvider.isAvailable()) {
      try {
        voice = await addisAiProvider.generateVoice(
          cleanedAnswer,
          result.language,
          { voiceId: input.voiceId }
        );
      } catch (err: any) {
        console.warn('[AssistantService] Voice generation error (gracefully skipped):', err?.message);
      }
    }

    return {
      answer: cleanedAnswer,
      language: result.language,
      intent: result.intent,
      places: result.places,
      weather: result.weather,
      incidents: result.incidents,
      sources: result.sources,
      limitations: result.limitations,
      voice,
    };
  }

  /**
   * Directly synthesizes speech from text using Addis AI Voices 2.
   */
  public async synthesizeSpeech(
    text: string,
    language: SupportedLanguage = 'en',
    voiceId?: string
  ): Promise<AddisVoiceResult | null> {
    return addisAiProvider.generateVoice(text, language, { voiceId });
  }
}

export const assistantService = new AssistantService();
