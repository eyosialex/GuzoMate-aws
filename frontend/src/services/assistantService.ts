import { request } from '../lib/apiClient';
import { AssistantQueryPayload, AssistantQueryResponse, Language } from '../types';

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
  async query(payload: AssistantQueryPayload): Promise<AssistantQueryResponse> {
    try {
      return await request<AssistantQueryResponse>('/assistant/query', {
        method: 'POST',
        body: JSON.stringify(payload),
        language: payload.language,
      });
    } catch (err: any) {
      if (err?.status === 404) {
        return await request<AssistantQueryResponse>('/assistant/assistant/query', {
          method: 'POST',
          body: JSON.stringify(payload),
          language: payload.language,
        });
      }
      throw err;
    }
  },

  async transcribeAudio(audioBlob: Blob, language: Language = 'en'): Promise<{ text: string }> {
    const base64Data = await blobToBase64(audioBlob);
    const mimeType = audioBlob.type || 'audio/webm';

    const token = localStorage.getItem('guzomate_token') || localStorage.getItem('guzo_access_token');
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/speech/transcriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': language,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          audio: base64Data,
          mimeType,
          language,
        }),
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Audio transcription failed: ${response.statusText}`);
    }

    const json = await response.json();
    return json?.data ?? json;
  },

  async synthesizeSpeech(text: string, language: Language = 'en'): Promise<string | null> {
    const token = localStorage.getItem('guzomate_token') || localStorage.getItem('guzo_access_token');
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/speech/synthesis`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': language,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, language }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await response.json();
      const data = json?.data ?? json;
      if (data?.audioUrl) return data.audioUrl;
      if (data?.audioBase64) {
        return `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
      }
      return null;
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
};
