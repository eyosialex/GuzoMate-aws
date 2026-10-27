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

    let userText = recognizedTranscript?.trim() || '';

    // If browser speech recognition did not produce transcript, transcribe audio blob
    if (!userText && audioBlob) {
      try {
        const transRes = await assistantService.transcribeAudio(audioBlob, language);
        userText = transRes.text?.trim() || '';
      } catch (err) {
        console.warn('Transcription failed:', err);
      }
    }

    if (!userText) {
      throw new Error('No voice recognized. Please speak clearly into your microphone.');
    }

    // Query AI assistant with the transcribed text
    const assistantRes = await assistantService.query({
      query: userText,
      language,
      location: userLocation,
      enableVoice: true,
    });

    // Synthesize response audio
    let audioUrl: string | undefined;
    try {
      const audioBlobRes = await assistantService.synthesizeSpeech(assistantRes.answer, language);
      if (audioBlobRes) {
        audioUrl = URL.createObjectURL(audioBlobRes);
      }
    } catch (err) {
      console.warn('Audio synthesis failed:', err);
    }

    return {
      transcript: userText,
      answer: assistantRes.answer,
      audioUrl,
      audioDurationSeconds: 4,
      places: assistantRes.places,
      weather: assistantRes.weather,
      sources: assistantRes.sources,
    };
  },
};
