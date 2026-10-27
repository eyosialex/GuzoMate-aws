// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { assistantService } from '../assistantService';
import {
  AssistantResponse,
  SpeechSynthesisResponse,
  ClearMemoryResponse,
} from '../../types/assistant';

describe('Assistant Module Integration (Phase 8)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('guzomate_token', 'mock_jwt_token_for_phase8');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockAssistantResponse: AssistantResponse = {
    answer: 'In Arat Kilo, Tomoca Coffee is located approximately 120 meters away. Light rain is expected.',
    language: 'en',
    intent: 'COMPOSITE',
    places: [
      {
        id: '10492812',
        name: 'Tomoca Coffee',
        category: 'cafe',
        location: {
          lat: 9.0335,
          lon: 38.7632,
        },
        distanceMeters: 120.4,
        address: 'Arat Kilo, King George VI St, Addis Ababa',
        tags: { amenity: 'cafe' },
        source: 'openstreetmap',
      },
    ],
    weather: {
      location: {
        lat: 9.033,
        lon: 38.763,
      },
      current: {
        temperatureC: 19.5,
        condition: 'Partly Cloudy',
        precipitationMm: 0.2,
        windKph: 11.2,
      },
      arrivalAdvice: {
        arrivalTime: '2026-10-27T16:00:00+03:00',
        suggestions: [
          {
            type: 'umbrella',
            text: 'Carry an umbrella or rain jacket.',
            reason: '60% probability of light rain.',
          },
        ],
      },
    },
    incidents: [
      {
        id: 'c71e21b0-449e-4e4a-b5e1-8f5bc65181a9',
        type: 'CONSTRUCTION',
        description: 'Right lane closed for cable maintenance.',
        severity: 'LOW',
        distanceMeters: 150.0,
      },
    ],
    sources: [
      { type: 'openstreetmap', retrievedAt: '2026-10-27T10:50:00.000Z' },
      { type: 'weatherapi', retrievedAt: '2026-10-27T10:50:00.000Z' },
    ],
    limitations: ['Opening hours not verified in current open database.'],
    voice: {
      provider: 'addis-ai',
      voiceId: 'en-emma',
      language: 'en',
      audioUrl: 'https://cdn.addisassistant.com/audio/sample.mp3',
      mimeType: 'audio/mpeg',
      durationSeconds: 4.2,
    },
  };

  it('1. should query assistant and receive grounded answer with places, weather, and incidents (POST /assistant/query)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify(mockAssistantResponse),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await assistantService.query({
      query: 'Find a cafe near Arat Kilo',
      language: 'en',
      location: { lat: 9.033, lon: 38.763 },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('/assistant/query');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      query: 'Find a cafe near Arat Kilo',
      language: 'en',
      location: { lat: 9.033, lon: 38.763 },
    });
    expect(result.answer).toContain('Tomoca Coffee');
    expect(result.places.length).toBe(1);
    expect(result.weather?.current?.temperatureC).toBe(19.5);
    expect(result.incidents.length).toBe(1);
  });

  it('2. should pass userId header and enableVoice flag for persistent multi-turn memory and voice', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify(mockAssistantResponse),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await assistantService.query({
      query: 'Is it still open?',
      language: 'en',
      userId: 'traveler_session_xyz',
      enableVoice: true,
    });

    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers['x-user-id']).toBe('traveler_session_xyz');
    expect(JSON.parse(init?.body as string).enableVoice).toBe(true);
    expect(result.voice?.audioUrl).toBe('https://cdn.addisassistant.com/audio/sample.mp3');
  });

  it('3. should synthesize speech with language and voice parameters (POST /assistant/speech/synthesis)', async () => {
    const mockSpeechRes: SpeechSynthesisResponse = {
      provider: 'addis-ai',
      voiceId: 'am-hamen',
      language: 'am',
      audioUrl: 'https://cdn.addisassistant.com/audio/am_sample.mp3',
      mimeType: 'audio/mpeg',
      durationSeconds: 3.5,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify(mockSpeechRes),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await assistantService.synthesizeSpeech({
      text: 'መንገድዎ ክፍት ነው',
      language: 'am',
      voice: 'am-hamen',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('/assistant/speech/synthesis');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      text: 'መንገድዎ ክፍት ነው',
      language: 'am',
      voice: 'am-hamen',
    });
    expect(result.voiceId).toBe('am-hamen');
    expect(result.durationSeconds).toBe(3.5);
  });

  it('4. should clear conversation session memory (POST /assistant/memory/clear)', async () => {
    const mockClearRes: ClearMemoryResponse = {
      success: true,
      message: "Persistent session memory cleared for user 'traveler_123'.",
      deletedTurns: 4,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify(mockClearRes),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await assistantService.clearMemory('traveler_123');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('/assistant/memory/clear');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ userId: 'traveler_123' });
    expect(result.success).toBe(true);
    expect(result.deletedTurns).toBe(4);
  });

  it('5. should transcribe speech audio blob (POST /speech/transcriptions)', async () => {
    const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            text: 'Where is the nearest pharmacy?',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await assistantService.transcribeAudio(mockBlob, 'en');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('/speech/transcriptions');
    expect(init?.method).toBe('POST');
    expect(result.text).toBe('Where is the nearest pharmacy?');
  });
});
