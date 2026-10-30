import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { weatherCache } from '../src/modules/travel-services/weather/weather.cache.js';
import { weatherApiProvider } from '../src/modules/travel-services/weather/weatherapi.provider.js';
import { osrmProvider } from '../src/modules/travel-services/routing/osrm.provider.js';
import { addisAiSpeechProvider } from '../src/modules/travel-services/speech/addis-ai.provider.js';
import { prisma } from '../src/config/database.js';
import { registerAndVerifyTestUser } from './test-helpers.js';

describe('Member 3: Travel Services API', () => {
  let authToken = '';
  let testUserEmail = '';

  beforeAll(async () => {
    // Register real test user to obtain valid access token for auth-protected endpoints
    const testUser = await registerAndVerifyTestUser({
      name: 'Travel Services Tester',
      password: 'Password123!',
      preferredLanguage: 'en',
    });
    authToken = testUser.accessToken;
    testUserEmail = testUser.email;
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: 'travel_tester_' } },
      });
      await prisma.weatherCache.deleteMany({
        where: { cacheKey: { contains: 'weather:9.' } },
      });
    } catch {
      // Best-effort cleanup
    }
  });

  beforeEach(async () => {
    weatherCache.clearMemory();
    try {
      await prisma.weatherCache.deleteMany({
        where: { cacheKey: { contains: 'weather:9.' } },
      });
    } catch {
      // Ignore in mock environment
    }
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // A. Weather Services Tests
  // ===========================================================================
  describe('Weather Services (/weather/*)', () => {
    it('GET /weather/current - should return current weather with valid coordinates', async () => {
      vi.spyOn(weatherApiProvider, 'fetchForecast').mockResolvedValueOnce({
        location: { lat: 9.03, lon: 38.74 },
        current: {
          temperatureC: 22,
          condition: 'Partly cloudy',
          precipitationMm: 0,
          windKph: 10,
        },
        forecast: [],
        provider: 'weatherapi',
        retrievedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .get('/api/v1/weather/current')
        .query({ lat: 9.03, lon: 38.74 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.location.lat).toBe(9.03);
      expect(res.body.current.temperatureC).toBe(22);
      expect(res.body.current.condition).toBe('Partly cloudy');
      expect(res.body.provider).toBe('weatherapi');
      expect(res.body.cached).toBe(false);
    });

    it('GET /weather/current - should return cached: true on consecutive request', async () => {
      vi.spyOn(weatherApiProvider, 'fetchForecast').mockResolvedValueOnce({
        location: { lat: 9.05, lon: 38.75 },
        current: {
          temperatureC: 20,
          condition: 'Clear sky',
          precipitationMm: 0,
          windKph: 5,
        },
        forecast: [],
        provider: 'weatherapi',
        retrievedAt: new Date().toISOString(),
      });

      // First call (fetches from provider)
      const res1 = await request(app)
        .get('/api/v1/weather/current')
        .query({ lat: 9.05, lon: 38.75 });
      expect(res1.status).toBe(200);
      expect(res1.body.cached).toBe(false);

      // Second call (hits cache)
      const res2 = await request(app)
        .get('/api/v1/weather/current')
        .query({ lat: 9.05, lon: 38.75 });
      expect(res2.status).toBe(200);
      expect(res2.body.cached).toBe(true);
      expect(res2.body.current.temperatureC).toBe(20);
    });

    it('GET /weather/forecast - should return multi-day hourly forecast', async () => {
      vi.spyOn(weatherApiProvider, 'fetchForecast').mockResolvedValueOnce({
        location: { lat: 9.03, lon: 38.74 },
        current: {
          temperatureC: 20,
          condition: 'Mainly clear',
          precipitationMm: 0,
          windKph: 8,
        },
        forecast: [
          {
            date: '2026-10-25',
            hourly: [
              {
                time: '2026-10-25T14:00:00+03:00',
                temperatureC: 21,
                condition: 'Partly cloudy',
                precipitationProbability: 15,
              },
            ],
          },
        ],
        provider: 'weatherapi',
        retrievedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .get('/api/v1/weather/forecast')
        .query({ lat: 9.03, lon: 38.74, days: 3 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.forecast)).toBe(true);
      expect(res.body.forecast[0].hourly[0].temperatureC).toBe(21);
    });

    it('GET /weather/arrival-advice - should provide destination forecast and rain advice for arrival time', async () => {
      const futureArrivalIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      vi.spyOn(weatherApiProvider, 'fetchForecast').mockResolvedValueOnce({
        location: { lat: 9.11, lon: 38.81 },
        current: {
          temperatureC: 18,
          condition: 'Moderate rain',
          precipitationMm: 4.5,
          windKph: 12,
        },
        forecast: [
          {
            date: futureArrivalIso.split('T')[0],
            hourly: [
              {
                time: futureArrivalIso,
                temperatureC: 17,
                condition: 'Moderate rain',
                precipitationProbability: 75,
              },
            ],
          },
        ],
        provider: 'weatherapi',
        retrievedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .get('/api/v1/weather/arrival-advice')
        .query({ lat: 9.11, lon: 38.81, arrivalTime: futureArrivalIso });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.arrivalTime).toBe(futureArrivalIso);
      expect(res.body.forecast.temperatureC).toBe(17);
      expect(Array.isArray(res.body.suggestions)).toBe(true);
      const umbrellaAdvice = res.body.suggestions.find((s: any) => s.type === 'accessory');
      expect(umbrellaAdvice).toBeDefined();
      expect(umbrellaAdvice.text.toLowerCase()).toContain('umbrella');
    });

    it('GET /weather/arrival-advice - should calculate ETA minutes and provide advice in Amharic', async () => {
      vi.spyOn(weatherApiProvider, 'fetchForecast').mockResolvedValueOnce({
        location: { lat: 9.12, lon: 38.82 },
        current: {
          temperatureC: 14,
          condition: 'ብርድ',
          precipitationMm: 0,
          windKph: 6,
        },
        forecast: [
          {
            date: new Date().toISOString().split('T')[0],
            hourly: [
              {
                time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
                temperatureC: 14,
                condition: 'ብርድ',
                precipitationProbability: 10,
              },
            ],
          },
        ],
        provider: 'weatherapi',
        retrievedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .get('/api/v1/weather/arrival-advice')
        .query({ lat: 9.12, lon: 38.82, etaMinutes: 45, lang: 'am' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.language).toBe('am');
      const clothingAdvice = res.body.suggestions.find((s: any) => s.type === 'clothing');
      expect(clothingAdvice).toBeDefined();
      expect(clothingAdvice.text).toContain('ልብስ');
    });

    it('GET /weather/current - should reject invalid latitude or longitude with 400', async () => {
      const res = await request(app)
        .get('/api/v1/weather/current')
        .query({ lat: 95.5, lon: 38.74 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /weather/arrival-advice - should reject missing both arrivalTime and etaMinutes with 400', async () => {
      const res = await request(app)
        .get('/api/v1/weather/arrival-advice')
        .query({ lat: 9.03, lon: 38.74 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ===========================================================================
  // B. Routing & Transit Services Tests
  // ===========================================================================
  describe('Routing & Transit Services (/routes)', () => {
    it('GET /routes - should calculate driving route with legs, steps, distance, and duration', async () => {
      vi.spyOn(osrmProvider, 'getRoute').mockResolvedValueOnce({
        id: 'route-driving-123',
        mode: 'driving',
        summary: 'Driving route via Churchill Ave (4.2 km, ~12 min)',
        durationSeconds: 720,
        durationMinutes: 12,
        distanceMeters: 4200,
        geometry: { type: 'LineString', coordinates: [[38.75, 9.03], [38.76, 9.01]] },
        legs: [
          {
            distanceMeters: 4200,
            durationSeconds: 720,
            summary: 'Churchill Ave',
            steps: [
              {
                name: 'Churchill Ave',
                distanceMeters: 2000,
                durationSeconds: 300,
                maneuver: {
                  type: 'depart',
                  instruction: 'Head towards Churchill Ave',
                  location: [38.75, 9.03],
                },
              },
            ],
          },
        ],
        source: 'osrm',
        sourceUpdatedAt: new Date().toISOString(),
        isLiveSchedule: false,
      });

      const res = await request(app)
        .get('/api/v1/routes')
        .query({
          originLat: 9.03,
          originLon: 38.75,
          destLat: 9.01,
          destLon: 38.76,
          mode: 'driving',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('addis-transit');
      expect(res.body.routes.length).toBeGreaterThan(0);
      expect(res.body.routes[0].mode).toBe('driving');
      expect(res.body.routes[0].distanceMeters).toBe(4200);
      expect(res.body.routes[0].legs[0].steps.length).toBeGreaterThan(0);
    });

    it('GET /routes - should support walking mode with pedestrian instructions', async () => {
      vi.spyOn(osrmProvider, 'getRoute').mockResolvedValueOnce({
        id: 'route-walking-123',
        mode: 'walking',
        summary: 'Walking path (1.1 km, ~14 min)',
        durationSeconds: 840,
        durationMinutes: 14,
        distanceMeters: 1100,
        geometry: { type: 'LineString', coordinates: [[38.75, 9.03], [38.752, 9.035]] },
        legs: [],
        source: 'osrm',
        sourceUpdatedAt: new Date().toISOString(),
        isLiveSchedule: false,
      });

      const res = await request(app)
        .get('/api/v1/routes')
        .query({
          originLat: 9.03,
          originLon: 38.75,
          destLat: 9.035,
          destLon: 38.752,
          mode: 'walking',
        });

      expect(res.status).toBe(200);
      expect(res.body.routes[0].mode).toBe('walking');
      expect(res.body.routes[0].durationMinutes).toBe(14);
    });

    it('GET /routes - should evaluate Addis Ababa LRT corridor when origin and destination are near stations', async () => {
      // Ayat Station (9.0272, 38.8681) to Megenagna Station (9.0205, 38.7842)
      const res = await request(app)
        .get('/api/v1/routes')
        .query({
          originLat: 9.027,
          originLon: 38.868,
          destLat: 9.021,
          destLon: 38.784,
          mode: 'transit',
        });

      expect(res.status).toBe(200);
      expect(res.body.routes.length).toBe(1);
      const lrtRoute = res.body.routes[0];
      expect(lrtRoute.mode).toBe('transit');
      expect(lrtRoute.source).toBe('addis-transit-static');
      expect(lrtRoute.fareEtb).toBeGreaterThanOrEqual(5);
      expect(lrtRoute.transitStops).toBeDefined();
      expect(lrtRoute.transitStops[0]).toContain('Ayat');
    });

    it('GET /routes - should report unavailable live transit feed when coordinates are far from transit corridors', async () => {
      const res = await request(app)
        .get('/api/v1/routes')
        .query({
          originLat: 8.5,
          originLon: 39.2,
          destLat: 8.52,
          destLon: 39.22,
          mode: 'transit',
        });

      expect(res.status).toBe(200);
      expect(res.body.transitStatus.liveTrackingAvailable).toBe(false);
      expect(res.body.limitations.length).toBeGreaterThan(0);
      expect(res.body.limitations[0]).toContain('Live GTFS schedule feeds');
    });

    it('GET /routes - should reject missing destination coordinates with 400', async () => {
      const res = await request(app)
        .get('/api/v1/routes')
        .query({
          originLat: 9.03,
          originLon: 38.75,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ===========================================================================
  // C. Speech Services Tests (STT and TTS)
  // ===========================================================================
  describe('Speech Services (/speech/*)', () => {
    it('POST /speech/transcriptions - should require JWT authentication (returns 401 without token)', async () => {
      const res = await request(app)
        .post('/api/v1/speech/transcriptions')
        .send({
          audio: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
          language: 'am',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /speech/transcriptions - should reject unsupported audio MIME type with 400', async () => {
      const res = await request(app)
        .post('/api/v1/speech/transcriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          audio: 'data:application/pdf;base64,JVBERi0xLjUKJYCBgoNCg==',
          mimeType: 'application/pdf',
          language: 'am',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /speech/transcriptions - should transcribe audio when provider is available', async () => {
      vi.spyOn(addisAiSpeechProvider, 'isAvailable').mockReturnValue(true);
      vi.spyOn(addisAiSpeechProvider, 'transcribe').mockResolvedValueOnce({
        text: 'የአዲስ አበባ ጉዞ መመሪያ',
        language: 'am',
        detectedLanguage: 'am',
        confidence: 0.96,
        provider: 'addis-ai',
      });

      const res = await request(app)
        .post('/api/v1/speech/transcriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          audio: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
          language: 'am',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.text).toBe('የአዲስ አበባ ጉዞ መመሪያ');
      expect(res.body.confidence).toBe(0.96);
      expect(res.body.provider).toBe('addis-ai');
    });

    it('POST /speech/transcriptions - should return 503 when provider credentials are unconfigured', async () => {
      vi.spyOn(addisAiSpeechProvider, 'isAvailable').mockReturnValue(false);

      const res = await request(app)
        .post('/api/v1/speech/transcriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          audio: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
          language: 'am',
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROVIDER_ERROR');
    });

    it('POST /speech/synthesis - should synthesize spoken audio from text', async () => {
      vi.spyOn(addisAiSpeechProvider, 'isAvailable').mockReturnValue(true);
      vi.spyOn(addisAiSpeechProvider, 'synthesize').mockResolvedValueOnce({
        provider: 'addis-ai',
        voiceId: 'am-hamen',
        language: 'am',
        audioUrl: 'https://cdn.addisassistant.com/audio/sample-123.mp3',
        mimeType: 'audio/mpeg',
        durationSeconds: 3.5,
      });

      const res = await request(app)
        .post('/api/v1/speech/synthesis')
        .send({
          text: 'እንኳን ወደ አዲስ አበባ በደህና መጡ',
          language: 'am',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.voiceId).toBe('am-hamen');
      expect(res.body.audioUrl).toBe('https://cdn.addisassistant.com/audio/sample-123.mp3');
      expect(res.body.durationSeconds).toBe(3.5);
    });

    it('POST /speech/synthesis - should reject empty text with 400', async () => {
      const res = await request(app)
        .post('/api/v1/speech/synthesis')
        .send({
          text: '',
          language: 'en',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /speech/synthesis - should reject text exceeding character limit (1000 chars)', async () => {
      const longText = 'a'.repeat(1050);

      const res = await request(app)
        .post('/api/v1/speech/synthesis')
        .send({
          text: longText,
          language: 'en',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
