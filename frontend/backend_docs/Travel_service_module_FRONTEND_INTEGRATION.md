# GuzoMate Travel Services Module — Frontend Integration Guide 🗺️🌦️🗣️

## 1. Overview & Architecture

The **Travel Services Module** delivers specialized mobility services designed specifically for travelers navigating Addis Ababa:
1. **Weather Intelligence:** Current conditions, multi-day forecasts, and arrival-time clothing/umbrella advice in **English (`en`)**, **Amharic (`am`)**, and **Afaan Oromo (`om`)**.
2. **Multimodal Routing & Transit:** Turn-by-turn driving, walking directions (via OSRM engine), and localized Addis Ababa public transit (Minibus taxis, Anbessa Bus, Sheger Bus, and Light Rail Transit) with **live incident intersection alerts**.
3. **Speech Services:** Addis AI speech-to-text (STT) audio transcription and text-to-speech (TTS) voice synthesis in Amharic, Afaan Oromo, and English.

- **Base URL:** `/api/v1`
- **Route Summary:**
  - Weather: `GET /api/v1/weather/current`, `GET /api/v1/weather/forecast`, `GET /api/v1/weather/arrival-advice`
  - Routing: `GET /api/v1/routes`
  - Speech: `POST /api/v1/speech/transcriptions`, `POST /api/v1/speech/synthesis`

---

## 2. Weather Services Endpoints

### 2.1 Get Current Weather

Fetches live temperature, weather conditions, precipitation, humidity, and wind speed. Localized condition descriptions are available in Amharic, Afaan Oromo, and English.

- **Endpoint:** `GET /api/v1/weather/current`
- **Auth Required:** No (Public)
- **Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `lat` | `number` | **Yes** | — | Latitude (-90 to 90). |
| `lon` | `number` | **Yes** | — | Longitude (-180 to 180). |
| `lang` or `language` | `string` | No | `"en"` | `"en"`, `"am"`, or `"om"`. |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "location": {
      "lat": 9.03,
      "lon": 38.74
    },
    "temperatureC": 21.4,
    "condition": "ደመናማ" ,
    "conditionCode": "cloudy",
    "humidityPercent": 62,
    "precipitationMm": 0.0,
    "windKph": 9.5,
    "feelsLikeC": 21.0,
    "isDay": true,
    "language": "am",
    "provider": "weatherapi",
    "retrievedAt": "2026-10-27T10:45:00.000Z",
    "cached": true
  }
}
```

---

### 2.2 Get Weather Forecast (Up to 14 Days)

Provides day-by-day and hour-by-hour forecast projections.

- **Endpoint:** `GET /api/v1/weather/forecast`
- **Auth Required:** No (Public)
- **Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `lat` | `number` | **Yes** | — | Latitude. |
| `lon` | `number` | **Yes** | — | Longitude. |
| `days` | `integer` | No | `3` | Number of days to forecast (1 to 14). |
| `lang` | `string` | No | `"en"` | `"en"`, `"am"`, or `"om"`. |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "location": { "lat": 9.03, "lon": 38.74 },
    "forecast": [
      {
        "date": "2026-10-27",
        "maxTempC": 23.5,
        "minTempC": 12.0,
        "avgTempC": 17.8,
        "condition": "Partly Cloudy",
        "hourly": [
          {
            "time": "2026-10-27T12:00:00+03:00",
            "temperatureC": 22.0,
            "condition": "Sunny",
            "precipitationProbability": 10
          }
        ]
      }
    ],
    "provider": "weatherapi",
    "retrievedAt": "2026-10-27T10:45:00.000Z"
  }
}
```

---

### 2.3 Get Destination Arrival Weather Advice

Predicts the weather condition at the traveler's exact arrival time and recommends clothing, umbrella, or travel precautions.

- **Endpoint:** `GET /api/v1/weather/arrival-advice`
- **Auth Required:** No (Public)
- **Query Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `lat` | `number` | **Yes** | Destination latitude. |
| `lon` | `number` | **Yes** | Destination longitude. |
| `arrivalTime` | `ISO string` | Either this or `etaMinutes` | Scheduled arrival time (e.g. `2026-10-27T16:30:00+03:00`). |
| `etaMinutes` | `integer` | Either this or `arrivalTime` | Minutes until arrival (e.g. `45`). |
| `lang` | `string` | No | `"en"`, `"am"`, or `"om"` (default: `"en"`). |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "location": { "lat": 9.03, "lon": 38.74 },
    "arrivalTime": "2026-10-27T16:30:00.000Z",
    "forecastAtArrival": {
      "temperatureC": 17.0,
      "condition": "Light Rain Shower",
      "precipitationProbability": 70
    },
    "suggestions": [
      {
        "type": "umbrella",
        "text": "Carry an umbrella or raincoat.",
        "reason": "Rain probability is 70% around your arrival time."
      },
      {
        "type": "clothing",
        "text": "Wear a light jacket or sweater.",
        "reason": "Temperature will drop to 17°C."
      }
    ]
  }
}
```

---

## 3. Multimodal Routing & Transit Endpoints

### 3.1 Calculate Route with Live Incident Warnings

Calculates driving, walking, or public transit routes between coordinates. Automatically cross-references the route path with active road hazards in the database and embeds `incidentAlerts`.

- **Endpoint:** `GET /api/v1/routes`
- **Auth Required:** No (Public)
- **Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `originLat` | `number` | **Yes** | — | Departure latitude. |
| `originLon` | `number` | **Yes** | — | Departure longitude. |
| `destLat` *(or `destinationLat`)* | `number` | **Yes** | — | Destination latitude. |
| `destLon` *(or `destinationLon`)* | `number` | **Yes** | — | Destination longitude. |
| `mode` | `string` | No | `"driving"` | `"driving"`, `"walking"`, `"transit"`, or `"all"`. |
| `language` | `string` | No | `"en"` | `"en"`, `"am"`, or `"om"`. |
| `includeIncidents` | `boolean` | No | `true` | When true, includes hazards on route. |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "provider": "guzomate-routing",
    "origin": { "lat": 9.03, "lon": 38.74 },
    "destination": { "lat": 8.995, "lon": 38.784 },
    "mode": "driving",
    "routes": [
      {
        "id": "route_driving_1",
        "mode": "driving",
        "summary": "Via Debre Zeit Rd / Bole Rd",
        "durationSeconds": 1380,
        "durationMinutes": 23,
        "distanceMeters": 7450,
        "fareEtb": null,
        "legs": [
          {
            "distanceMeters": 7450,
            "durationSeconds": 1380,
            "steps": [
              {
                "name": "Ras Mekonnen Ave",
                "distanceMeters": 1200,
                "durationSeconds": 180,
                "maneuver": {
                  "type": "turn",
                  "modifier": "right",
                  "instruction": "Turn right onto Ras Mekonnen Ave",
                  "location": [38.745, 9.028]
                }
              }
            ]
          }
        ],
        "incidentAlerts": [
          {
            "incidentId": "c71e21b0-449e-4e4a-b5e1-8f5bc65181a9",
            "type": "CONSTRUCTION",
            "description": "Right lane closed near Meskel Square.",
            "severity": "MEDIUM",
            "location": { "lat": 9.012, "lon": 38.762 },
            "distanceMeters": 45.0
          }
        ],
        "source": "osrm",
        "isLiveSchedule": false
      }
    ],
    "transitStatus": {
      "liveTrackingAvailable": false,
      "gtfsRealtimeAvailable": false,
      "notice": "Minibus and Anbessa Bus schedules are based on standard routes and typical headway.",
      "coveredOperators": ["Minibus Taxi", "Anbessa City Bus", "Sheger Express", "Addis Light Rail"]
    },
    "limitations": [],
    "retrievedAt": "2026-10-27T10:45:00.000Z"
  }
}
```

---

## 4. Speech Services (STT & TTS) Endpoints

### 4.1 Speech-to-Text Audio Transcription (STT)

Transcribes recorded traveler voice notes or voice commands into text in Amharic, Afaan Oromo, or English.

- **Endpoint:** `POST /api/v1/speech/transcriptions`
- **Auth Required:** Yes (`Bearer <accessToken>`)
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "audio": "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH...",
  "format": "webm",
  "language": "am"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `audio` | `string` | **Yes** | Base64 encoded audio string or publicly accessible audio URL (max 10MB). |
| `format` | `string` | No | `"wav"`, `"mp3"`, `"webm"`, `"ogg"`, or `"m4a"`. |
| `language` | `string` | No | Target speech language: `"am"`, `"om"`, or `"en"`. Default: `"am"`. |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "text": "ወደ መስቀል አደባባይ የሚወስደው መንገድ እንዴት ነው?",
    "language": "am",
    "detectedLanguage": "am",
    "confidence": 0.94,
    "provider": "addis-ai"
  }
}
```

---

### 4.2 Text-to-Speech Voice Synthesis (TTS)

Generates crystal-clear spoken audio clips from text using localized Addis AI speech voices or Gemini TTS fallback.

- **Endpoint:** `POST /api/v1/speech/synthesis`
- **Auth Required:** No (Optional Bearer token for guest travelers)
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "text": "ወደ ቦሌ የሚወስደው መስመር በከባድ ትራፊክ ምክንያት ዘግይቷል።",
  "language": "am",
  "voiceId": "am-hamen"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `text` | `string` | **Yes** | Text to vocalize (max 1,000 characters). |
| `language` | `string` | No | `"am"`, `"om"`, or `"en"`. Default: `"am"`. |
| `voiceId` | `string` | No | `"am-hamen"` (Amharic), `"om-bikila"` (Afaan Oromo), `"en-emma"` (English). |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "provider": "addis-ai",
    "voiceId": "am-hamen",
    "language": "am",
    "audioUrl": "https://cdn.addisassistant.com/audio/out.mp3",
    "audioBase64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
    "mimeType": "audio/mpeg",
    "durationSeconds": 4.1
  }
}
```

---

## 5. TypeScript Interfaces for Frontend

```typescript
export type TravelLanguage = 'en' | 'am' | 'om';
export type RouteMode = 'driving' | 'walking' | 'transit' | 'all';

export interface WeatherData {
  location: { lat: number; lon: number };
  temperatureC: number;
  condition: string;
  conditionCode: string;
  humidityPercent: number;
  precipitationMm: number;
  windKph: number;
  feelsLikeC: number;
  isDay: boolean;
  language: TravelLanguage;
  cached: boolean;
}

export interface ArrivalAdviceData {
  arrivalTime: string;
  forecastAtArrival: {
    temperatureC: number;
    condition: string;
    precipitationProbability: number;
  };
  suggestions: Array<{
    type: 'umbrella' | 'clothing' | 'warning' | string;
    text: string;
    reason: string;
  }>;
}

export interface RouteOption {
  id: string;
  mode: 'driving' | 'walking' | 'transit';
  summary: string;
  durationSeconds: number;
  durationMinutes: number;
  distanceMeters: number;
  fareEtb?: number | null;
  fareExplanation?: string;
  legs: Array<{
    distanceMeters: number;
    durationSeconds: number;
    steps: Array<{
      name: string;
      distanceMeters: number;
      durationSeconds: number;
      maneuver: {
        type: string;
        modifier?: string;
        instruction: string;
        location: [number, number];
      };
    }>;
  }>;
  incidentAlerts?: Array<{
    incidentId: string;
    type: string;
    description: string;
    severity: string | null;
    location: { lat: number; lon: number };
    distanceMeters: number;
  }>;
}

export interface RoutesResponseData {
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  mode: RouteMode;
  routes: RouteOption[];
  transitStatus: {
    liveTrackingAvailable: boolean;
    notice: string;
    coveredOperators: string[];
  };
}

export interface SpeechSynthesisData {
  provider: string;
  voiceId: string;
  language: TravelLanguage;
  audioUrl?: string | null;
  audioBase64?: string | null;
  mimeType: string;
  durationSeconds?: number | null;
}
```

---

## 6. Frontend Voice Recording & Navigation Recipes

### 6.1 Browser Audio Recorder Hook for Speech-to-Text (React)
```typescript
import { useState, useRef } from 'react';
import { apiClient } from '../lib/api-client';

export function useAudioTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopAndTranscribe = async (language: 'am' | 'om' | 'en' = 'am'): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) return reject(new Error('Recorder not initialized'));

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result as string;
            const res = await apiClient.post('/speech/transcriptions', {
              audio: base64Data,
              format: 'webm',
              language,
            });
            resolve(res.data.data.text);
          } catch (err) {
            reject(err);
          }
        };
      };

      mediaRecorderRef.current.stop();
    });
  };

  return { isRecording, startRecording, stopAndTranscribe };
}
```

### 6.2 Displaying Route Hazard Badges on Navigation
```tsx
import React from 'react';
import { RouteOption } from '../types/travel-services';

export const RouteOptionCard: React.FC<{ route: RouteOption; onSelect: () => void }> = ({
  route,
  onSelect,
}) => {
  const hasHazards = Boolean(route.incidentAlerts && route.incidentAlerts.length > 0);

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border cursor-pointer transition ${
        hasHazards ? 'border-amber-400 bg-amber-50/30' : 'border-gray-200 hover:border-blue-500'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="font-bold text-gray-900">{route.summary}</span>
          <div className="text-sm text-gray-500">
            {route.durationMinutes} min • {(route.distanceMeters / 1000).toFixed(1)} km
            {route.fareEtb && ` • ${route.fareEtb} ETB`}
          </div>
        </div>
        <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
          {route.mode}
        </span>
      </div>

      {/* Road hazard warning banner along this route */}
      {hasHazards && (
        <div className="mt-3 p-2 bg-amber-100/70 border border-amber-300 rounded text-xs text-amber-900 flex items-center space-x-1.5">
          <span>⚠️</span>
          <span>
            {route.incidentAlerts!.length} active hazard(s) reported on this route (
            {route.incidentAlerts!.map((a) => a.type).join(', ')})
          </span>
        </div>
      )}
    </div>
  );
};
```
