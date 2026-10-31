export type SpeechLanguage = 'en' | 'am' | 'om';

export interface SpeechTranscriptionRequest {
  audio: string; // Base64-encoded audio bytes or accessible audio URL
  format?: 'wav' | 'mp3' | 'webm' | 'ogg' | 'm4a';
  mimeType?: string;
  language?: SpeechLanguage;
}

export interface SpeechTranscriptionResponse {
  text: string;
  language: SpeechLanguage;
  detectedLanguage?: string;
  confidence?: number | null;
  provider: string;
}

export interface SpeechSynthesisRequest {
  text: string;
  language?: SpeechLanguage;
  voiceId?: string;
}

export interface SpeechSynthesisResponse {
  provider: string;
  voiceId: string;
  language: SpeechLanguage;
  audioUrl?: string | null;
  audioBase64?: string | null;
  mimeType: string;
  durationSeconds?: number | null;
}


export interface ISpeechProvider {
  isAvailable(): boolean;
  transcribe(
    audio: string,
    language?: SpeechLanguage,
    options?: { mimeType?: string; format?: string }
  ): Promise<SpeechTranscriptionResponse>;
  synthesize(text: string, language?: SpeechLanguage, voiceId?: string): Promise<SpeechSynthesisResponse>;
}
