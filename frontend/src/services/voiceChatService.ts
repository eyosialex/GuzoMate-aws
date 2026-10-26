import { Language, Place, WeatherData, AssistantSource } from '../types';
import { MOCK_PLACES, MOCK_WEATHER } from '../lib/mockData';
import { createPleasantChimeUrl } from '../lib/audioTone';

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
}

/**
 * Service to communicate with the voice chat backend.
 * Currently provides UI-ready mocks until the backend voice endpoint is connected.
 */
export const voiceChatService = {
  async sendVoiceRecording(params: SendVoiceParams): Promise<VoiceChatResponse> {
    const { recognizedTranscript, language } = params;

    // Simulate backend network latency (600ms - 900ms)
    await new Promise((resolve) => setTimeout(resolve, 750));

    // Determine what the user said:
    // If speech recognition captured a real transcript, use it;
    // Otherwise fallback to contextual sample travel queries.
    let userText = recognizedTranscript?.trim() || '';
    if (!userText) {
      const sampleQueries: Record<Language, string[]> = {
        en: [
          'Find traditional buna coffee spots near Bole and will it rain today?',
          'Where is the nearest hospital around Meskel Square?',
          'What are the best hotels near Bole International Airport?',
        ],
        am: [
          'ቦሌ አካባቢ ያሉ ባህላዊ የቡና ቤቶችን አሳየኝ እና ዛሬ ዝናብ ይዘንባል?',
          'መስቀል አደባባይ አቅራቢያ የሚገኝ ሆስፒታል የት አለ?',
        ],
        om: [
          'Magaalaa Finfinnee keessatti bakka buna aadaa fi rooba har\'aa natti himi.',
        ],
      };
      const queries = sampleQueries[language] || sampleQueries.en;
      userText = queries[Math.floor(Math.random() * queries.length)];
    }

    // Determine contextual assistant answer
    const lower = userText.toLowerCase();
    let answer = '';
    let places: Place[] | undefined;
    let weather: WeatherData | null = null;

    if (lower.includes('coffee') || lower.includes('ቡና') || lower.includes('buna') || lower.includes('cafe')) {
      places = MOCK_PLACES.filter((p) => p.category === 'cafe');
      weather = MOCK_WEATHER;
      answer =
        language === 'am'
          ? 'ቦሌ አካባቢ ምርጥ ባህላዊ የቡና ቦታዎችን አግኝቻለሁ። ቶሞካ እና ካሊዲስ ክፍት ናቸው። የአየር ሁኔታው 22°C ሲሆን ከሰአት በኋላ መጠነኛ ዝናብ ሊኖር ይችላል።'
          : 'I found excellent traditional coffee houses around Bole including Tomoka and Kaldi\'s. The current temperature is 22°C with light scattered showers expected this afternoon.';
    } else if (lower.includes('hospital') || lower.includes('ሆስፒታል') || lower.includes('hospitaal')) {
      places = MOCK_PLACES.filter((p) => p.category === 'hospital');
      answer =
        language === 'am'
          ? 'በመስቀል አደባባይ እና አካባቢው ያሉ ድንገተኛ የሕክምና መስጫ ሆስፒታሎችን አዘጋጅቼልዎታለሁ።'
          : 'Here are the emergency hospital options near Meskel Square with verified trauma and emergency wings.';
    } else {
      places = MOCK_PLACES.slice(0, 3);
      weather = MOCK_WEATHER;
      answer =
        language === 'am'
          ? `የተናገሩትን ሰምቻለሁ፡ "${userText}"። የአዲስ አበባ ከተማ መረጃዎችን እና የአየር ሁኔታ ትንበያውን አዘጋጅቼልዎታለሁ።`
          : `I heard you: "${userText}". Here is the localized Addis Ababa travel guide and live conditions.`;
    }

    // Generate a valid playable audio URL for immediate playback in the UI
    const audioUrl = createPleasantChimeUrl();

    return {
      transcript: userText,
      answer,
      audioUrl,
      audioDurationSeconds: 3,
      places,
      weather,
      sources: [
        { type: 'GuzoMate Voice Engine v2.0', retrievedAt: new Date().toISOString() },
        { type: 'OpenStreetMap Ethiopia Node', retrievedAt: new Date().toISOString() },
      ],
    };
  },
};
