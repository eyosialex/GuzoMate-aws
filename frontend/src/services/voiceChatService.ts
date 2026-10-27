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

    // Prefer the voice URL/base64 already returned by the assistant response.
    // Only fall back to a separate TTS call if the server did not return audio.
    let audioUrl: string | undefined;
    const voiceData = (assistantRes as any).voice;
    if (voiceData?.audioUrl) {
      audioUrl = voiceData.audioUrl;
    } else if (voiceData?.audioBase64 && voiceData?.mimeType) {
      audioUrl = `data:${voiceData.mimeType};base64,${voiceData.audioBase64}`;
    } else {
      // Fallback: request TTS separately (covers cases where server-side voice is disabled)
      try {
        const synthAudio = await assistantService.synthesizeSpeech(assistantRes.answer, language);
        if (synthAudio) {
          audioUrl = synthAudio;
        }
      } catch (err) {
        console.warn('[voiceChatService] Fallback TTS synthesis failed:', err);
      }
    }

    const audioDurationSeconds: number | undefined = voiceData?.durationSeconds ?? undefined;

    return {
      transcript: userText,
      answer: assistantRes.answer,
      audioUrl,
      audioDurationSeconds,
      places: assistantRes.places,
      weather: assistantRes.weather,
      sources: assistantRes.sources,
    };
  },
};
