import { request } from '../lib/apiClient';
import {
  AssistantQueryPayload,
  AssistantResponse,
  SpeechSynthesisPayload,
  SpeechSynthesisResponse,
  ClearMemoryResponse,
  AssistantLanguage,
} from '../types/assistant';
import { Language } from '../types';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const assistantService = {
  /**
   * Submits a conversational query in English, Amharic, or Afaan Oromo.
   * Grounded with OpenStreetMap POIs, live incidents, and WeatherAPI data.
   * POST /api/v1/assistant/query
   */
  async query(payload: AssistantQueryPayload): Promise<AssistantResponse> {
    const headers: Record<string, string> = {};
    if (payload.userId) {
      headers['x-user-id'] = payload.userId;
    }

    try {
      return await request<AssistantResponse>('/assistant/assistant/query', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        language: payload.language,
      });
    } catch {
      return await request<AssistantResponse>('/assistant/query', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        language: payload.language,
      });
    }
  },

  /**
   * Direct text-to-speech synthesis (TTS) for localized navigation and advisory audio.
   * POST /api/v1/assistant/speech/synthesis
   */
  async synthesizeSpeech(
    input: SpeechSynthesisPayload | string,
    language: AssistantLanguage = 'en'
  ): Promise<SpeechSynthesisResponse> {
    const payload: SpeechSynthesisPayload =
      typeof input === 'string' ? { text: input, language } : input;

    return await request<SpeechSynthesisResponse>('/assistant/speech/synthesis', {
      method: 'POST',
      body: JSON.stringify(payload),
      language: payload.language,
    });
  },

  /**
   * Clears persistent multi-turn conversation memory for a user session.
   * POST /api/v1/assistant/memory/clear
   */
  async clearMemory(userId?: string): Promise<ClearMemoryResponse> {
    const headers: Record<string, string> = {};
    if (userId) {
      headers['x-user-id'] = userId;
    }

    try {
      return await request<ClearMemoryResponse>('/assistant/assistant/memory/clear', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: userId || 'default_traveler' }),
      });
    } catch {
      return await request<ClearMemoryResponse>('/assistant/memory/clear', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: userId || 'default_traveler' }),
      });
    }
  },

  /**
   * Transcribes traveler speech recording (STT) for voice queries.
   * POST /api/v1/speech/transcriptions
   */
  async transcribeAudio(audioBlob: Blob, language: Language = 'en'): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', language);

    const token = localStorage.getItem('guzomate_token') || localStorage.getItem('guzo_access_token');
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/speech/transcriptions`,
      {
        method: 'POST',
        headers: {
          'Accept-Language': language,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Audio transcription failed: ${response.statusText}`);
    }

    const json = await response.json();
    return json?.data ?? json;
  },
};
