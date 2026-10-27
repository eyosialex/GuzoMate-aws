# GuzoMate Assistant Module — Frontend Integration Guide 🤖🎙️

## 1. Overview & Architecture

The **Assistant Module** is GuzoMate’s conversational travel intelligence engine. It provides strict zero-hallucination, grounded answers in **English (`en`)**, **Amharic (`am`)**, and **Afaan Oromo (`om`)** for travelers in Addis Ababa.

### Key Capabilities for Frontend Developers:
1. **Multilingual NLP & Voice:** Returns natural language answers and optional synthesized speech audio (`enableVoice: true`).
2. **PostGIS & Grounded RAG:** Combines OpenStreetMap POIs, live community road hazards, and WeatherAPI data into a single verified response.
3. **Structured Entity Cards:** Responses include structured `places`, `weather`, and `incidents` objects alongside the text answer so you can render interactive UI cards and map pins without parsing text!
4. **Persistent Session Memory:** Remembers recent chat turns for follow-up questions (e.g. *"Is it open?"* after asking about a cafe). Memory can be cleared via UI button or natural language (*"Erase your memory"* / *"ትዝታህን አጥፋ"*).

- **Base URL:** `/api/v1/assistant`
- **Authentication:** Public / Optional User ID header (`x-user-id` or request body `userId`).

---

## 2. Endpoints Reference

### 2.1 Multilingual Travel Assistant Query

Submit traveler questions in natural language (English, Amharic, or Afaan Oromo).

- **Endpoint:** `POST /api/v1/assistant/query`
- **Headers:**
  - `Content-Type: application/json`
  - `x-user-id: <string>` *(Optional, used for persistent session memory)*
  - `x-request-id: <string>` *(Optional, for tracking request logs)*

#### Request Body
```json
{
  "query": "Find a quiet cafe near Arat Kilo and tell me if it will rain when I arrive.",
  "language": "en",
  "location": {
    "lat": 9.033,
    "lon": 38.763
  },
  "arrivalTime": "2026-10-27T16:00:00+03:00",
  "filters": {
    "radiusMeters": 3000,
    "categories": ["cafe"]
  },
  "enableVoice": true,
  "voiceId": "en-emma",
  "userId": "traveler_session_123"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `query` | `string` | **Yes** | 1 to 1000 characters. Can be in English, Amharic (Ethiopic script), or Afaan Oromo (Latin script). |
| `language` | `string` | No | `"en"`, `"am"`, or `"om"`. If omitted, auto-detected from query text! |
| `location` | `object` | No | Traveler coordinates `{ lat: number, lon: number }`. |
| `arrivalTime` | `ISO 8601 string` | No | Expected arrival time for destination weather check. |
| `filters.radiusMeters`| `number` | No | PostGIS search radius in meters (50m to 50,000m). Default: `3000`. |
| `filters.categories` | `string[]` | No | Category filter (e.g. `["cafe", "pharmacy", "hotel"]`). |
| `enableVoice` | `boolean` | No | If `true`, returns synthesized spoken audio (TTS). Default: `false`. |
| `voiceId` | `string` | No | Voice identifier (e.g., `"am-hamen"`, `"om-bikila"`, `"en-emma"`). |
| `userId` | `string` | No | Unique device or user ID for multi-turn conversation memory. |

---

#### Success Response (`200 OK`)
```json
{
  "answer": "In Arat Kilo, Tomoca Coffee is located approximately 120 meters away. Light rain is expected around 4:00 PM, so carrying an umbrella is advised.",
  "language": "en",
  "intent": "COMPOSITE",
  "places": [
    {
      "id": "10492812",
      "name": "Tomoca Coffee",
      "category": "cafe",
      "location": {
        "lat": 9.0335,
        "lon": 38.7632
      },
      "distanceMeters": 120.4,
      "address": "Arat Kilo, King George VI St, Addis Ababa",
      "tags": {
        "amenity": "cafe",
        "outdoor_seating": "yes"
      },
      "source": "openstreetmap"
    }
  ],
  "weather": {
    "location": {
      "lat": 9.033,
      "lon": 38.763
    },
    "current": {
      "temperatureC": 19.5,
      "condition": "Partly Cloudy",
      "precipitationMm": 0.2,
      "windKph": 11.2
    },
    "arrivalAdvice": {
      "arrivalTime": "2026-10-27T16:00:00+03:00",
      "suggestions": [
        {
          "type": "umbrella",
          "text": "Carry an umbrella or rain jacket.",
          "reason": "60% probability of light rain at 4:00 PM."
        }
      ]
    },
    "provider": "weatherapi",
    "retrievedAt": "2026-10-27T10:45:00.000Z",
    "cached": true
  },
  "incidents": [
    {
      "id": "c71e21b0-449e-4e4a-b5e1-8f5bc65181a9",
      "type": "CONSTRUCTION",
      "description": "Right lane closed for cable maintenance near Arat Kilo square.",
      "status": "ACTIVE",
      "verification": "COMMUNITY_CONFIRMED",
      "location": {
        "lat": 9.034,
        "lon": 38.764
      },
      "distanceMeters": 150.0,
      "createdAt": "2026-10-27T08:00:00.000Z"
    }
  ],
  "sources": [
    { "type": "openstreetmap", "retrievedAt": "2026-10-27T10:50:00.000Z" },
    { "type": "weatherapi", "retrievedAt": "2026-10-27T10:50:00.000Z" }
  ],
  "limitations": [
    "Opening hours not verified in current open database."
  ],
  "voice": {
    "provider": "addis-ai",
    "voiceId": "en-emma",
    "language": "en",
    "audioUrl": "https://cdn.addisassistant.com/audio/sample.mp3",
    "audioBase64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
    "mimeType": "audio/mpeg",
    "durationSeconds": 4.2
  }
}
```

---

### 2.2 Direct Speech Synthesis (TTS)

Direct text-to-speech synthesis for localized navigation directions and advice.

- **Endpoint:** `POST /api/v1/assistant/speech/synthesis` (also available at `POST /api/v1/speech/synthesis`)
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "text": "መንገድዎ በግንባታ ምክንያት ሊዘጋጋ ይችላል፣ እባክዎ በቶሎ ይውጡ።",
  "language": "am",
  "voice": "am-hamen"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `text` | `string` | **Yes** | Text to speak (max 400 characters cleaned). |
| `language` | `string` | No | `"am"`, `"om"`, or `"en"`. Default: `"am"`. |
| `voice` | `string` | No | `"am-hamen"`, `"om-bikila"`, `"en-emma"`. |

#### Success Response (`200 OK`)
```json
{
  "provider": "addis-ai",
  "voiceId": "am-hamen",
  "language": "am",
  "audioUrl": "https://cdn.addisassistant.com/audio/out.mp3",
  "audioBase64": "UklGRiQAAABX...",
  "mimeType": "audio/mpeg",
  "durationSeconds": 3.8
}
```

---

### 2.3 Clear Conversation Memory

Clears persistent session history for the user.

- **Endpoint:** `POST /api/v1/assistant/memory/clear` OR `DELETE /api/v1/assistant/memory`
- **Request Body:**
  ```json
  {
    "userId": "traveler_session_123"
  }
  ```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Persistent session memory cleared for user 'traveler_session_123'.",
  "deletedTurns": 6
}
```

---

## 3. Supported Voices & Languages Reference

| Language | Code | Default Voice ID | Character Set |
| :--- | :--- | :--- | :--- |
| **Amharic** | `am` | `am-hamen` | Ethiopic Script (ፊደል, e.g. ካፌ፣ ሆስፒታል) |
| **Afaan Oromo** | `om` | `om-bikila` | Latin / Qubee Script (e.g. mana bunaa, hospitaala) |
| **English** | `en` | `en-emma` | Latin Script |

---

## 4. TypeScript Interfaces for Frontend

```typescript
export type AssistantLanguage = 'en' | 'am' | 'om';

export interface AssistantQueryPayload {
  query: string;
  language?: AssistantLanguage;
  location?: {
    lat: number;
    lon: number;
  };
  arrivalTime?: string;
  filters?: {
    radiusMeters?: number;
    categories?: string[];
  };
  enableVoice?: boolean;
  voiceId?: string;
  userId?: string;
}

export interface AssistantVoiceData {
  provider: 'addis-ai';
  voiceId: string;
  language: AssistantLanguage;
  audioUrl: string;
  audioBase64?: string;
  mimeType: string;
  durationSeconds?: number;
}

export interface AssistantResponse {
  answer: string;
  language: AssistantLanguage;
  intent: string;
  places: Array<{
    id: string;
    name: string | null;
    category: string;
    location: { lat: number; lon: number };
    distanceMeters: number;
    address: string | null;
    tags: Record<string, any>;
  }>;
  weather: {
    location: { lat: number; lon: number };
    current?: {
      temperatureC: number;
      condition: string;
      precipitationMm: number | null;
      windKph: number | null;
    };
    arrivalAdvice?: {
      arrivalTime: string;
      suggestions: Array<{ type: string; text: string; reason: string }>;
    };
  } | null;
  incidents: Array<{
    id: string;
    type: string;
    description: string;
    severity?: string;
    distanceMeters: number;
  }>;
  limitations: string[];
  voice?: AssistantVoiceData | null;
}
```

---

## 5. Frontend UI Integration Recipes

### 5.1 Chat Bubble + Auto Audio Player Component (React)
```tsx
import React, { useState, useRef } from 'react';
import { AssistantResponse } from '../types/assistant';

export const AssistantMessageItem: React.FC<{ data: AssistantResponse }> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="bg-gray-50 border rounded-2xl p-4 space-y-3">
      {/* Natural language response */}
      <div className="text-gray-900 leading-relaxed font-sans">{data.answer}</div>

      {/* Audio Playback Chip */}
      {data.voice?.audioUrl && (
        <div className="flex items-center space-x-2 pt-1">
          <audio
            ref={audioRef}
            src={data.voice.audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <button
            onClick={toggleAudio}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center space-x-1 hover:bg-blue-700 transition"
          >
            <span>{isPlaying ? '⏸ Pause Voice' : '🔊 Listen (Addis AI)'}</span>
            {data.voice.durationSeconds && (
              <span className="opacity-75">({data.voice.durationSeconds}s)</span>
            )}
          </button>
        </div>
      )}

      {/* Render Structured Place Cards */}
      {data.places.length > 0 && (
        <div className="pt-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggested Places</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
            {data.places.slice(0, 3).map((p) => (
              <div key={p.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-sm">
                <div className="font-bold text-gray-800">{p.name || 'Point of Interest'}</div>
                <div className="text-xs text-gray-500">{p.category} • {Math.round(p.distanceMeters)}m away</div>
                {p.address && <div className="text-xs text-gray-400 truncate mt-1">{p.address}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grounding Disclaimers */}
      {data.limitations.length > 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 rounded p-2">
          ⚠️ {data.limitations.join(' • ')}
        </div>
      )}
    </div>
  );
};
```
