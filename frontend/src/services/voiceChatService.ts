import { Language, Place, WeatherData, AssistantSource, GeoLocation } from '../types';
import { assistantService } from './assistantService';

export interface VoiceChatResponse {
  transcript: string;
  answer: string;
  audioUrl?: string;
  audioDurationSeconds?: number;
  places?: Place[];
  weather?: WeatherData | null;
  sources?: AssistantSource[];
}

export interface SendVoiceParams {
  audioBlob?: Blob;
  recognizedTranscript?: string;
  language: Language;
  userLocation?: GeoLocation;
}

export const voiceChatService = {
  async sendVoiceRecording(params: SendVoiceParams): Promise<VoiceChatResponse> {
    const { audioBlob, recognizedTranscript, language, userLocation } = params;

    let userText = '';

    // 1. Transcribe the full recorded audio blob using the backend STT engine
    let backendText = '';
    if (audioBlob && audioBlob.size > 100) {
      try {
        const transRes = await assistantService.transcribeAudio(audioBlob, language);
        backendText = transRes.text?.trim() || '';
      } catch (err) {
        console.warn('Backend audio transcription failed, falling back to local recognition:', err);
      }
    }

    const browserText = recognizedTranscript?.trim() || '';

    // Pick the best transcript between backend STT and browser recognition
    if (backendText && backendText.length >= browserText.length) {
      userText = backendText;
    } else if (browserText) {
      userText = browserText;
    } else if (backendText) {
      userText = backendText;
    }

    if (!userText) {
      throw new Error('No voice recognized. Please speak clearly into your microphone.');
    }

    // Query AI assistant with the transcribed text (voice generation is handled server-side)
    const assistantRes = await assistantService.query({
      query: userText,
      language,
      location: userLocation,
      enableVoice: true,
    });

    // Check if voice was returned directly in assistant response
    let audioUrl: string | undefined = assistantRes.voice?.audioUrl || (
      assistantRes.voice?.audioBase64
        ? `data:${assistantRes.voice.mimeType || 'audio/mpeg'};base64,${assistantRes.voice.audioBase64}`
        : undefined
    );

    if (!audioUrl) {
      try {
        const speechRes = await assistantService.synthesizeSpeech({
          text: assistantRes.answer,
          language,
        });
        audioUrl = speechRes?.audioUrl;
      } catch (err) {
        console.warn('Audio synthesis fallback failed:', err);
      }
    }

    // Guarantee audioUrl is always present so the audio response is ALWAYS rendered in chat and played
    if (!audioUrl && assistantRes.answer) {
      audioUrl = `speech:${encodeURIComponent(assistantRes.answer)}?lang=${language}`;
    }

    const audioDurationSeconds: number = assistantRes.voice?.durationSeconds || 4;

    return {
      transcript: userText,
      answer: assistantRes.answer,
      audioUrl,
      audioDurationSeconds,
      places: assistantRes.places as any,
      weather: assistantRes.weather as any,
      sources: assistantRes.sources,
    };
  },
};
