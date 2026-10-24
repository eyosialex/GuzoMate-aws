import { AssistantQueryDto, SupportedLanguage } from './dto/assistant-query.dto.js';
import { AssistantQueryResponse, AddisVoiceResult } from './dto/assistant-response.dto.js';
import { intentService } from './intent/intent.service.js';
import { SecurityGuards } from './rag/guards.js';
import { ragService } from './rag/rag.service.js';
import { addisAiProvider } from './providers/addis-ai.provider.js';
import { memoryService } from './memory/memory.service.js';

export class AssistantService {
  /**
   * Main entrypoint for processing assistant queries.
   * Maintains a single persistent conversational session per user.
   */
  public async query(input: AssistantQueryDto): Promise<AssistantQueryResponse> {
    const userId = (input.userId && input.userId.trim()) || 'default_traveler';

    // 1. Sanitize user input against prompt injection
    const sanitizedQuery = SecurityGuards.sanitizeQuery(input.query);

    // 2. Detect language, intent, and entities
    const analysis = intentService.analyze(
      sanitizedQuery,
      input.language,
      input.location,
      input.arrivalTime
    );

    // 3. Check if user requested to erase/clear memory
    if (memoryService.isClearMemoryIntent(sanitizedQuery)) {
      await memoryService.clearMemory(userId);
      const clearConfirmation = memoryService.getMemoryClearedConfirmation(analysis.language);

      let voice: AddisVoiceResult | null = null;
      if (input.enableVoice !== false && addisAiProvider.isAvailable()) {
        voice = await addisAiProvider.generateVoice(
          clearConfirmation,
          analysis.language,
          { voiceId: input.voiceId }
        );
      }

      return {
        answer: clearConfirmation,
        language: analysis.language,
        intent: 'CLEAR_MEMORY',
        places: [],
        weather: null,
        incidents: [],
        sources: [],
        limitations: [],
        voice,
      };
    }

    // 4. Retrieve single-session conversation history for this user
    const history = await memoryService.getRecentHistory(userId, 8);

    // 5. Execute RAG pipeline with conversation history and database facts
    const result = await ragService.executePipeline(
      sanitizedQuery,
      analysis,
      input.location,
      history
    );

    // 6. Clean answer and validate against hallucination
    const cleanedAnswer = SecurityGuards.validateAnswer(result.answer);

    // 7. Persist conversational turn to the user's persistent single session
    await memoryService.recordMessage(userId, 'user', sanitizedQuery, result.language);
    await memoryService.recordMessage(userId, 'assistant', cleanedAnswer, result.language);

    // 8. Generate voice response via Addis AI (when enabled and available)
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
   * Clears all memory for a specific user.
   */
  public async clearUserMemory(userId: string): Promise<number> {
    return memoryService.clearMemory(userId);
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
