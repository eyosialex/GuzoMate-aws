import { request } from '../lib/apiClient';
import { AssistantQueryPayload, AssistantQueryResponse, Language } from '../types';

export const assistantService = {
  async query(payload: AssistantQueryPayload): Promise<AssistantQueryResponse> {
    return await request<AssistantQueryResponse>('/assistant/query', {
      method: 'POST',
      body: JSON.stringify(payload),
      language: payload.language,
    });
  },

  async transcribeAudio(audioBlob: Blob, language: Language = 'en'): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', language);

    const token = localStorage.getItem('guzo_access_token');
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/speech/transcriptions`, {
      method: 'POST',
      headers: {
        'Accept-Language': language,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Audio transcription failed: ${response.statusText}`);
    }

    const json = await response.json();
    return json?.data ?? json;
  },

  async synthesizeSpeech(text: string, language: Language = 'en'): Promise<Blob | null> {
    const token = localStorage.getItem('guzo_access_token');
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/speech/synthesis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': language,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text, language }),
    });

    if (!response.ok) {
      return null;
    }

    return await response.blob();
  },
};
