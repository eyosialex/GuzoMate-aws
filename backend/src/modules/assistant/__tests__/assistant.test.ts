import assert from 'node:assert';
import { intentService, detectLanguage, detectIntent } from '../intent/intent.service.js';
import { geminiProvider, generateGroundedResponse } from '../providers/gemini.provider.js';
import { SecurityGuards } from '../rag/guards.js';
import { ragService } from '../rag/rag.service.js';
import { AssistantQuerySchema } from '../dto/assistant-query.dto.js';
import { assistantService } from '../assistant.service.js';
import { addisAiProvider } from '../providers/addis-ai.provider.js';
import { weatherProvider } from '../providers/weather.provider.js';
import { memoryService } from '../memory/memory.service.js';

let passed = 0;
let failed = 0;

function it(desc: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          console.log(`  ✓ ${desc}`);
          passed++;
        })
        .catch((err) => {
          console.error(`  ✗ ${desc}:`, err.message);
          failed++;
        });
    }
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${desc}:`, err.message);
    failed++;
  }
}

async function runTests() {
  console.log('=== GuzoMate Member 2 Assistant Test Suite ===\n');

  console.log('[Task 1: Gemini Provider Grounded Response Adapter]');
  it('exposes generateGroundedResponse function and provider method', () => {
    assert.strictEqual(typeof generateGroundedResponse, 'function');
    assert.strictEqual(typeof geminiProvider.generateGroundedResponse, 'function');
  });

  console.log('\n[Task 2: Language & Intent Detection Service]');
  it('detects English query', () => {
    assert.strictEqual(detectLanguage('Where is a quiet cafe?'), 'en');
  });

  it('detects Amharic query (e.g. "መርካቶ አካባቢ ፋርማሲ አለ?")', () => {
    const query = 'መርካቶ አካባቢ ፋርማሲ አለ?';
    assert.strictEqual(detectLanguage(query), 'am');

    const analysis = detectIntent(query);
    assert.strictEqual(analysis.language, 'am');
    assert.strictEqual(analysis.intent, 'PLACES');
    assert.ok(analysis.entities.categories.includes('pharmacy'));
    assert.strictEqual(analysis.entities.destination, 'Mercato');
  });

  it('detects Afaan Oromo query (e.g. "Bakketti qorichi itti gurguramu eessa jira?")', () => {
    const query = 'Bakketti qorichi itti gurguramu eessa jira?';
    assert.strictEqual(detectLanguage(query), 'om');

    const analysis = detectIntent(query);
    assert.strictEqual(analysis.language, 'om');
    assert.strictEqual(analysis.intent, 'PLACES');
    assert.ok(analysis.entities.categories.includes('pharmacy'));
  });

  it('classifies PLACES intent', () => {
    const analysis = detectIntent('Find hospitals or clinics nearby');
    assert.strictEqual(analysis.intent, 'PLACES');
    assert.ok(analysis.entities.categories.includes('hospital'));
  });

  it('classifies WEATHER intent', () => {
    const analysis = detectIntent('Will it rain this afternoon in Addis Ababa?');
    assert.strictEqual(analysis.intent, 'WEATHER');
  });

  it('classifies ROUTING intent', () => {
    const analysis = detectIntent('How to get from Bole to Piazza by minibus?');
    assert.strictEqual(analysis.intent, 'ROUTING');
  });

  it('classifies INCIDENTS intent', () => {
    const analysis = detectIntent('Is there any road closure or traffic accident on Churchill road?');
    assert.strictEqual(analysis.intent, 'INCIDENTS');
    assert.strictEqual(analysis.entities.destination, 'Churchill Road');
  });

  it('classifies COMPOSITE intent and extracts entities for specified test query', () => {
    const query = 'Find a quiet cafe near Arat Kilo and tell me if it will rain when I arrive.';
    const loc = { lat: 9.033, lon: 38.763 };
    const arrTime = '2026-10-23T16:00:00+03:00';

    const analysis = detectIntent(query, 'en', loc, arrTime);
    assert.strictEqual(analysis.language, 'en');
    assert.strictEqual(analysis.intent, 'COMPOSITE');
    assert.ok(analysis.intents.includes('PLACES'));
    assert.ok(analysis.intents.includes('WEATHER'));
    assert.ok(analysis.entities.categories.includes('cafe'));
    assert.strictEqual(analysis.entities.destination, 'Arat Kilo');
    assert.deepStrictEqual(analysis.entities.coordinates, loc);
    assert.strictEqual(analysis.entities.arrivalTime, arrTime);
  });

  console.log('\n[Task 3: Grounded Context Builder (RAG Pipeline)]');
  await it('gathers evidence and formats context with required source headers', async () => {
    const analysis = detectIntent(
      'Find a quiet cafe near Arat Kilo and tell me if it will rain when I arrive.',
      'en',
      { lat: 9.033, lon: 38.763 },
      '2026-10-23T16:00:00+03:00'
    );

    const ragResult = await ragService.executePipeline(
      'Find a quiet cafe near Arat Kilo and tell me if it will rain when I arrive.',
      analysis,
      { lat: 9.033, lon: 38.763 }
    );

    assert.ok(ragResult.contextFacts.includes('[SOURCE: OpenStreetMap Verified POI]'));
    assert.ok(ragResult.contextFacts.includes('[SOURCE: WeatherAPI Forecast]'));
    assert.ok(ragResult.contextFacts.includes('[SOURCE: Unverified Community Incident Report]'));
    assert.strictEqual(ragResult.intent, 'COMPOSITE');
    assert.ok(ragResult.weather !== null);
  });

  console.log('\n[Task 4: Assistant API Controller & Route Schema]');
  it('validates documented request body payload', () => {
    const payload = {
      query: 'Find a quiet cafe near Arat Kilo and tell me if it will rain when I arrive.',
      language: 'en',
      location: { lat: 9.033, lon: 38.763 },
      arrivalTime: '2026-10-23T16:00:00+03:00',
    };

    const parsed = AssistantQuerySchema.safeParse(payload);
    assert.strictEqual(parsed.success, true);
  });

  await it('end-to-end assistant service query execution matching contract', async () => {
    const response = await assistantService.query({
      query: 'Find a quiet cafe near Arat Kilo and tell me if it will rain when I arrive.',
      language: 'en',
      location: { lat: 9.033, lon: 38.763 },
      arrivalTime: '2026-10-23T16:00:00+03:00',
    });

    assert.ok(response.answer);
    assert.strictEqual(response.language, 'en');
    assert.strictEqual(response.intent, 'COMPOSITE');
    assert.ok(Array.isArray(response.places));
    assert.ok(response.weather !== null);
    assert.ok(Array.isArray(response.incidents));
    assert.ok(Array.isArray(response.sources));
    assert.ok(Array.isArray(response.limitations));
  });

  console.log('\n[Task 5: Addis AI Multilingual Grounded LLM & Voice Integration]');
  it('detects Addis AI provider availability from environment', () => {
    assert.strictEqual(addisAiProvider.isAvailable(), true);
  });

  await it('generates grounded response based on database facts via Addis AI', async () => {
    const facts = '[SOURCE: OpenStreetMap Verified POI]\n- Tomoca Coffee (Cafe, 120m away in Arat Kilo, open)';
    const query = 'Is there a cafe near Arat Kilo?';
    const answer = await addisAiProvider.generateGroundedResponse(query, facts, 'am');
    assert.ok(answer.length > 0);
    assert.ok(answer.includes('ቶሞካ') || answer.includes('ካፌ') || answer.includes('አራት ኪሎ'));
  });

  await it('generates speech audio response via Addis AI Voices 2', async () => {
    const voiceResult = await addisAiProvider.generateVoice('ሰላም፣ እንኳን ወደ ጉዞሜት በደህና መጡ።', 'am');
    assert.ok(voiceResult !== null);
    assert.strictEqual(voiceResult.provider, 'addis-ai');
    assert.strictEqual(voiceResult.language, 'am');
    assert.strictEqual(voiceResult.voiceId, 'am-hamen');
    assert.ok(voiceResult.audioUrl.startsWith('https://'));
    assert.ok(typeof voiceResult.durationSeconds === 'number' && voiceResult.durationSeconds > 0);
  });

  await it('end-to-end assistant query produces grounded answer and Addis AI voice response', async () => {
    const response = await assistantService.query({
      query: 'መርካቶ አካባቢ ፋርማሲ አለ?',
      language: 'am',
      enableVoice: true,
    });

    assert.ok(response.answer.length > 0);
    assert.strictEqual(response.language, 'am');
    assert.ok(response.voice !== null && response.voice !== undefined);
    assert.strictEqual(response.voice?.provider, 'addis-ai');
    assert.ok(response.voice?.audioUrl.startsWith('https://'));
  });

  console.log('\n[Task 6: Live Weather Forecast & Destination Arrival Advice]');
  await it('retrieves live weather forecast and arrival suggestions from WEATHER_URL', async () => {
    // Forecast 1 hour 30 minutes in the future
    const futureTime = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    const weatherResult = await weatherProvider.getForecast(
      { lat: 9.033, lon: 38.763 },
      futureTime,
      'en'
    );

    assert.ok(weatherResult !== null);
    assert.ok(typeof weatherResult.current?.temperatureC === 'number');
    assert.ok(weatherResult.current?.condition);
    assert.ok(weatherResult.forecast && weatherResult.forecast.length > 0);
    assert.ok(weatherResult.arrivalAdvice !== undefined);
    assert.strictEqual(weatherResult.arrivalAdvice?.arrivalTime, futureTime);
    assert.ok(Array.isArray(weatherResult.arrivalAdvice?.suggestions));
    assert.ok(weatherResult.arrivalAdvice?.suggestions.length > 0);
  });

  await it('evaluates arrival weather and generates clothing/umbrella advice', async () => {
    const futureTime = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    const response = await assistantService.query({
      query: 'I will arrive at Arat Kilo in 1 hour and 30 minutes. What will the weather be and should I carry an umbrella or jacket?',
      language: 'en',
      location: { lat: 9.033, lon: 38.763 },
      arrivalTime: futureTime,
      enableVoice: false,
    });

    assert.ok(response.answer.length > 0);
    assert.ok(response.weather !== null);
    assert.ok(response.weather?.arrivalAdvice?.suggestions.length! > 0);
    assert.ok(
      response.answer.toLowerCase().includes('weather') ||
      response.answer.toLowerCase().includes('°c') ||
      response.answer.toLowerCase().includes('umbrella') ||
      response.answer.toLowerCase().includes('jacket') ||
      response.answer.toLowerCase().includes('clothing') ||
      response.answer.toLowerCase().includes('temperature')
    );
  });

  console.log('\n[Task 7: PostGIS Retrieval from addis_geo_points (13,861 Locations)]');
  await it('retrieves verified hospitals from addis_geo_points near Mercato', async () => {
    const response = await assistantService.query({
      query: 'Is there a hospital near Mercato?',
      language: 'en',
      location: { lat: 9.030, lon: 38.740 },
      enableVoice: false,
    });

    assert.ok(response.places.length > 0);
    assert.ok(response.places.some((p) => p.name && (p.name.toLowerCase().includes('health') || p.name.toLowerCase().includes('hospital') || p.name.toLowerCase().includes('clinic') || p.name.includes('ጤና') || p.name.includes('ሆስፒታል'))));
    assert.ok(!response.answer.toLowerCase().includes('no record of hospital'));
  });

  await it('retrieves verified restaurants from addis_geo_points near Arat Kilo', async () => {
    const response = await assistantService.query({
      query: 'Find a restaurant near Arat Kilo',
      language: 'en',
      location: { lat: 9.033, lon: 38.763 },
      enableVoice: false,
    });

    assert.ok(response.places.length > 0);
    assert.ok(response.places.some((p) => p.name && p.distanceMeters < 3000));
    assert.ok(!response.answer.toLowerCase().includes('no record of restaurant'));
  });

  console.log('\n[Task 8: Single-Session Conversation Memory & Erase]');
  it('detects natural language memory clear intents across EN, AM, and OM', () => {
    // English
    assert.strictEqual(memoryService.isClearMemoryIntent('erase your memory'), true);
    assert.strictEqual(memoryService.isClearMemoryIntent('please clear our chat history'), true);
    assert.strictEqual(memoryService.isClearMemoryIntent('forget everything I said'), true);
    assert.strictEqual(memoryService.isClearMemoryIntent('reset your memory'), true);
    // Amharic
    assert.strictEqual(memoryService.isClearMemoryIntent('እባክህ ትዝታህን አጥፋ'), true);
    assert.strictEqual(memoryService.isClearMemoryIntent('ማስታወሻህን አጥፋ'), true);
    assert.strictEqual(memoryService.isClearMemoryIntent('ሁሉንም እርሳ'), true);
    // Afaan Oromo
    assert.strictEqual(memoryService.isClearMemoryIntent('yaadannoo kee haqi'), true);
    assert.strictEqual(memoryService.isClearMemoryIntent('hunda irraanfadhu'), true);
    // Non-clear intents should be false
    assert.strictEqual(memoryService.isClearMemoryIntent('Where is the memorial museum?'), false);
    assert.strictEqual(memoryService.isClearMemoryIntent('How much is a taxi to Bole?'), false);
  });

  await it('records and persists turns in a single session for a specific user', async () => {
    const testUser = 'test_user_session_persistent';
    await memoryService.clearMemory(testUser);

    const firstResponse = await assistantService.query({
      query: 'I am planning a trip to Bole Medhanealem.',
      language: 'en',
      userId: testUser,
      enableVoice: false,
    });

    assert.ok(firstResponse.answer.length > 0);
    const history = await memoryService.getRecentHistory(testUser, 10);
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].role, 'user');
    assert.strictEqual(history[0].content, 'I am planning a trip to Bole Medhanealem.');
    assert.strictEqual(history[1].role, 'assistant');
    assert.ok(history[1].content.length > 0);
  });

  await it('uses prior conversation history in multi-turn assistant queries', async () => {
    const testUser = 'test_user_session_persistent';
    const followUp = await assistantService.query({
      query: 'Are there any banks near that cathedral?',
      language: 'en',
      userId: testUser,
      enableVoice: false,
    });

    assert.ok(followUp.answer.length > 0);
    const updatedHistory = await memoryService.getRecentHistory(testUser, 10);
    assert.strictEqual(updatedHistory.length, 4);
    assert.strictEqual(updatedHistory[2].role, 'user');
    assert.strictEqual(updatedHistory[2].content, 'Are there any banks near that cathedral?');
    assert.strictEqual(updatedHistory[3].role, 'assistant');
  });

  await it('clears user memory on natural language request ("erase your memory")', async () => {
    const testUser = 'test_user_session_persistent';
    const wipeResponse = await assistantService.query({
      query: 'Please erase your memory and start fresh',
      language: 'en',
      userId: testUser,
      enableVoice: false,
    });

    assert.strictEqual(wipeResponse.intent, 'CLEAR_MEMORY');
    assert.ok(wipeResponse.answer.toLowerCase().includes('cleared my memory'));

    const emptyHistory = await memoryService.getRecentHistory(testUser, 10);
    assert.strictEqual(emptyHistory.length, 0);
  });

  await it('clears user memory on Amharic natural language request ("ትዝታህን አጥፋ")', async () => {
    const amUser = 'test_user_amharic_memory';
    await memoryService.recordMessage(amUser, 'user', 'ሰላም');
    await memoryService.recordMessage(amUser, 'assistant', 'ሰላም! እንዴት ልርዳዎ?');

    const amWipe = await assistantService.query({
      query: 'እባክህ ትዝታህን አጥፋ',
      language: 'am',
      userId: amUser,
      enableVoice: false,
    });

    assert.strictEqual(amWipe.intent, 'CLEAR_MEMORY');
    assert.ok(amWipe.answer.includes('ማስታወሻዬን') || amWipe.answer.includes('አጥፍቻለሁ'));

    const emptyAmHistory = await memoryService.getRecentHistory(amUser, 10);
    assert.strictEqual(emptyAmHistory.length, 0);
  });

  console.log('\n[Task 9: Flexible City-Wide Recommendations & Leisure Places]');
  it('detects leisure and city-wide relaxation intent without rigid restriction', () => {
    const analysis = detectIntent('suggest me a place to relax anywhere');
    assert.strictEqual(analysis.intent, 'PLACES');
    assert.ok(analysis.entities.categories.includes('leisure'));
    assert.ok(analysis.entities.categories.includes('park'));
    assert.strictEqual(analysis.entities.isCityWide, true);
    assert.ok(analysis.entities.radiusMeters! >= 10000);
  });

  await it('flexibly suggests relaxation places (parks, cafes, gardens) even when GPS location is provided', async () => {
    const response = await assistantService.query({
      query: 'Suggest me a place to relax anywhere in Addis Ababa',
      location: { lat: 9.030, lon: 38.740 },
      language: 'en',
      enableVoice: false,
    });

    assert.ok(response.places.length > 0);
    assert.ok(response.answer.length > 0);
    assert.ok(!response.answer.toLowerCase().includes('i only have information'));
    assert.ok(
      response.answer.toLowerCase().includes('park') ||
      response.answer.toLowerCase().includes('cafe') ||
      response.answer.toLowerCase().includes('relax') ||
      response.answer.toLowerCase().includes('entoto') ||
      response.answer.toLowerCase().includes('friendship') ||
      response.answer.toLowerCase().includes('unity')
    );
  });

  console.log('\n[Task 10: Nearby First Priority & Progressive Expansion]');
  it('detects nearby-first default vs progressive expansion keywords', () => {
    // Normal query without explicit anywhere defaults to nearby (3000m)
    const normal = detectIntent('Suggest me a good cafe', 'en', { lat: 9.030, lon: 38.740 });
    assert.strictEqual(normal.entities.radiusMeters, 3000);
    assert.strictEqual(normal.entities.isCityWide, false);

    // Expansion query (user unsatisfied or asking for further/wider options) expands radius
    const expanded = detectIntent('Can you show me more options further away or outside this area?');
    assert.strictEqual(expanded.entities.radiusMeters, 7000);
    assert.strictEqual(expanded.entities.isExpansionRequested, true);
  });

  await it('prioritizes closest nearby places first when location is provided', async () => {
    const nearbyResponse = await assistantService.query({
      query: 'Suggest me a cafe near here',
      location: { lat: 9.030, lon: 38.740 },
      language: 'en',
      enableVoice: false,
    });

    assert.ok(nearbyResponse.places.length > 0);
    // Closest place should be immediately near the user (< 3000m)
    assert.ok(nearbyResponse.places[0].distanceMeters <= 3000);
    // Places must be ordered from nearest to farthest
    for (let i = 1; i < nearbyResponse.places.length; i++) {
      assert.ok(nearbyResponse.places[i].distanceMeters >= nearbyResponse.places[i - 1].distanceMeters);
    }
  });

  console.log(`\n=== Test Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
