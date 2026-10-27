import { request } from '../lib/apiClient';
import {
  TravelLanguage,
  SpeechTranscriptionPayload,
  SpeechTranscriptionResult,
  SpeechSynthesisPayload,
  SpeechSynthesisData,
} from '../types/travelServices';

export const speechService = {
  /**
   * Transcribes recorded traveler voice note or speech audio into text.
   * Requires Bearer authentication.
   * POST /api/v1/speech/transcriptions
   */
  async transcribe(
    audio: string,
    language: TravelLanguage = 'am',
    format: 'wav' | 'mp3' | 'webm' | 'ogg' | 'm4a' = 'webm'
  ): Promise<SpeechTranscriptionResult> {
    return await request<SpeechTranscriptionResult>('/speech/transcriptions', {
      method: 'POST',
      body: JSON.stringify({
        audio,
        format,
        language,
      } as SpeechTranscriptionPayload),
      language,
    });
  },

  /**
   * Helper that converts a recorded browser audio Blob to base64 and transcribes it.
   */
  async transcribeBlob(
    audioBlob: Blob,
    language: TravelLanguage = 'am'
  ): Promise<string> {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    const res = await this.transcribe(base64Data, language, 'webm');
    return res.text;
  },

  /**
   * Synthesizes localized natural speech audio from text.
   * POST /api/v1/speech/synthesis
   */
  async synthesize(
    text: string,
    language: TravelLanguage = 'am',
    voiceId?: string
  ): Promise<SpeechSynthesisData> {
    return await request<SpeechSynthesisData>('/speech/synthesis', {
      method: 'POST',
      body: JSON.stringify({
        text,
        language,
        voiceId: voiceId || (language === 'am' ? 'am-hamen' : language === 'om' ? 'om-bikila' : 'en-emma'),
      } as SpeechSynthesisPayload),
      language,
    });
  },
};
