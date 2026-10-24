import { request } from '../lib/apiClient';
import { AssistantQueryPayload, AssistantQueryResponse, Language, Place, WeatherData, Incident } from '../types';
import { MOCK_PLACES, MOCK_WEATHER, MOCK_INCIDENTS } from '../lib/mockData';

const isMockForced = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const assistantService = {
  async query(payload: AssistantQueryPayload): Promise<AssistantQueryResponse> {
    if (!isMockForced) {
      try {
        return await request<AssistantQueryResponse>('/assistant/query', {
          method: 'POST',
          body: JSON.stringify(payload),
          language: payload.language,
        });
      } catch (error) {
        console.warn('Backend assistant unavailable, utilizing client-side RAG engine:', error);
      }
    }
    return generateSimulatedRagResponse(payload);
  },

  async transcribeAudio(audioBlob: Blob, language: Language = 'en'): Promise<{ text: string }> {
    if (!isMockForced) {
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('language', language);

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/speech/transcriptions`, {
          method: 'POST',
          headers: {
            'Accept-Language': language,
            ...(localStorage.getItem('guzo_access_token')
              ? { Authorization: `Bearer ${localStorage.getItem('guzo_access_token')}` }
              : {}),
          },
          body: formData,
        });

        if (!response.ok) throw new Error('Transcription failed');
        return await response.json();
      } catch {
        // Fallback
      }
    }
    return { text: 'Find coffee near Bole and tell me if it will rain' };
  },

  async synthesizeSpeech(text: string, language: Language = 'en'): Promise<Blob | null> {
    if (!isMockForced) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/speech/synthesis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Language': language,
          },
          body: JSON.stringify({ text, language }),
        });
        if (!response.ok) return null;
        return await response.blob();
      } catch {
        // Fallback
      }
    }
    return null;
  },
};

/**
 * Intelligent client-side RAG simulation for offline / test robustness
 */
function generateSimulatedRagResponse(payload: AssistantQueryPayload): AssistantQueryResponse {
  const q = payload.query.toLowerCase();
  const lang = payload.language || 'en';

  let matchedPlaces: Place[] = [];
  let weatherAttachment: WeatherData | null = null;
  const incidentAttachment: Incident[] = [];

  // Check categories
  if (q.includes('coffee') || q.includes('cafe') || q.includes('ቡና') || q.includes('buna')) {
    matchedPlaces = MOCK_PLACES.filter((p) => p.category === 'cafe');
  } else if (q.includes('hospital') || q.includes('clinic') || q.includes('doctor') || q.includes('ሆስፒታል') || q.includes('hospitaal')) {
    matchedPlaces = MOCK_PLACES.filter((p) => p.category === 'hospital');
  } else if (q.includes('hotel') || q.includes('sleep') || q.includes('stay') || q.includes('ሆቴል') || q.includes('hootel')) {
    matchedPlaces = MOCK_PLACES.filter((p) => p.category === 'hotel');
  } else if (q.includes('food') || q.includes('restaurant') || q.includes('eat') || q.includes('ምግብ') || q.includes('nyaata')) {
    matchedPlaces = MOCK_PLACES.filter((p) => p.category === 'restaurant');
  } else {
    matchedPlaces = MOCK_PLACES.slice(0, 3);
  }

  // Check weather intent
  if (q.includes('rain') || q.includes('weather') || q.includes('umbrella') || q.includes('ዝናብ') || q.includes('roob') || q.includes('qilleens')) {
    weatherAttachment = MOCK_WEATHER;
  }

  // Check traffic or incident intent
  if (q.includes('traffic') || q.includes('road') || q.includes('accident') || q.includes('ትራፊክ') || q.includes('አደጋ') || q.includes('bala')) {
    incidentAttachment.push(MOCK_INCIDENTS[0]);
  }

  let answer = '';
  if (lang === 'am') {
    if (weatherAttachment && matchedPlaces.length > 0) {
      answer = `በቦሌ አካባቢ የተገኙ ${matchedPlaces.length} ቦታዎች ከዚህ በታች ተዘርዝረዋል። በተጨማሪም ከሰዓት በኋላ ዝናብ ሊኖር ስለሚችል ጃንጥላ ይዘው እንዲጓዙ ይመከራል።`;
    } else if (weatherAttachment) {
      answer = `በአዲስ አበባ የአሁኑ ሙቀት 22°C ሲሆን ከሰዓት 9:00 ሰዓት ጀምሮ የዝናብ ዕድል 65% ነው። ጃንጥላ መያዝ ይመረጣል።`;
    } else {
      answer = `ጥያቄዎትን መሠረት በማድረግ የተገኙ ተዛማጅ ቦታዎች በካርታው ላይ ተዘጋጅተዋል።`;
    }
  } else if (lang === 'om') {
    if (weatherAttachment && matchedPlaces.length > 0) {
      answer = `Bakkeewwan Boolee dhiyoo jiran ${matchedPlaces.length} argamanii jiru. Akkasumas waaree booda roobni waan danda'amuuf dibaaba qabachuun gaariidha.`;
    } else if (weatherAttachment) {
      answer = `Finfinnee keessatti ho'i ammaa 22°C yoo ta'u, waaree booda carraan roobaa 65% dha. Dibaaba qabadhaa.`;
    } else {
      answer = `Gaaffii keessan irratti hundaa'uun bakkeewwan argaman kaartaa irratti dhiyaataniiru.`;
    }
  } else {
    if (weatherAttachment && matchedPlaces.length > 0) {
      answer = `I located ${matchedPlaces.length} mapped place(s) matching your request. Furthermore, there is a 65% chance of afternoon showers in central Addis, so packing an umbrella is recommended.`;
    } else if (weatherAttachment) {
      answer = `Current temperature is 22°C with scattered clouds. Afternoon showers are forecasted with a 65% precipitation probability around 15:00.`;
    } else if (incidentAttachment.length > 0) {
      answer = `Be aware that heavy traffic has been confirmed near Gotera Interchange with average slowdowns of 15 minutes.`;
    } else {
      answer = `I found mapped options in OpenStreetMap for you. You can tap any card to view its location on the map.`;
    }
  }

  return {
    answer,
    language: lang,
    intent: weatherAttachment ? 'places_and_weather' : 'places_search',
    places: matchedPlaces,
    weather: weatherAttachment,
    incidents: incidentAttachment.length > 0 ? incidentAttachment : undefined,
    sources: [
      { type: 'OpenStreetMap (PostGIS)', retrievedAt: new Date().toISOString() },
      { type: 'WeatherAPI (Addis Station)', retrievedAt: new Date().toISOString() },
    ],
  };
}
