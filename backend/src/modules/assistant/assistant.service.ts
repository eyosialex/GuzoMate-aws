import { AssistantQueryDto } from './dto/assistant-query.dto.js';
import { AssistantQueryResponse } from './dto/assistant-response.dto.js';
import { IntentClassifier } from './intent/intent.classifier.js';
import { SecurityGuards } from './rag/guards.js';
import { ragService } from './rag/rag.service.js';
import { PromptTemplates } from './rag/prompt.templates.js';
import { geminiProvider } from './providers/gemini.provider.js';

export class AssistantService {
  /**
   * Main entrypoint for processing assistant queries.
   */
  public async query(input: AssistantQueryDto): Promise<AssistantQueryResponse> {
    // 1. Sanitize input against prompt injection
    const sanitizedQuery = SecurityGuards.sanitizeQuery(input.query);

    // 2. Classify intent, requested categories, and language
    const intent = IntentClassifier.classify(input);

    // 3. Retrieve structured facts, live weather, incidents, and vector knowledge
    const ragResult = await ragService.retrieveEvidence(intent, input.location, sanitizedQuery);

    const limitations = [...ragResult.limitations];
    let answer: string;

    // 4. Generate grounded conversational answer using Gemini (or graceful fallback)
    if (geminiProvider.isAvailable()) {
      try {
        const systemPrompt = PromptTemplates.getSystemPrompt(intent.language);
        const userPrompt = PromptTemplates.buildUserPrompt(sanitizedQuery, ragResult.evidenceBlock);

        const rawAnswer = await geminiProvider.generateText(systemPrompt, userPrompt, {
          temperature: 0.2,
          maxOutputTokens: 1024,
          timeoutMs: 8000,
        });

        answer = SecurityGuards.validateAnswer(rawAnswer);
      } catch (err: any) {
        console.warn('[AssistantService] Gemini generation fallback triggered:', err.message);
        limitations.push('Conversational generation unavailable; structured facts returned directly.');
        answer = this.generateFallbackAnswer(intent.language, ragResult.places.length, Boolean(ragResult.weather));
      }
    } else {
      limitations.push('Gemini API key is not configured. Returning verified structured data directly.');
      answer = this.generateFallbackAnswer(intent.language, ragResult.places.length, Boolean(ragResult.weather));
    }

    return {
      answer,
      language: intent.language,
      intent: intent.primaryIntent,
      places: ragResult.places,
      weather: ragResult.weather,
      incidents: ragResult.incidents,
      sources: ragResult.sources,
      limitations,
    };
  }

  /**
   * Multilingual fallback responses when the LLM provider is offline or unconfigured.
   */
  private generateFallbackAnswer(language: string, placesCount: number, hasWeather: boolean): string {
    switch (language) {
      case 'am':
        return placesCount > 0
          ? `የተጠየቁትን ቦታዎች እና መረጃዎችን አግኝተናል። ${placesCount} የተገኙ ቦታዎች ከታች ተዘርዝረዋል።`
          : 'ለተጠየቀው ጥያቄ የተገኘ መረጃ ከታች ተዘርዝሯል።';
      case 'om':
        return placesCount > 0
          ? `Odeeffannoo fi bakkeewwan barbaaddan argannee jirra. Bakkeewwan ${placesCount} argaman armaan gaditti tarreeffamaniiru.`
          : 'Odeeffannoo barbaaddan armaan gaditti argachuu dandeessu.';
      case 'en':
      default:
        return placesCount > 0
          ? `Found ${placesCount} mapped place(s) matching your request. Structured facts and verified details are displayed below.`
          : 'Here is the available travel information based on verified GuzoMate records.';
    }
  }
}

export const assistantService = new AssistantService();
