import assert from 'node:assert';
import { intentService, detectLanguage, detectIntent } from '../intent/intent.service.js';
import { geminiProvider, generateGroundedResponse } from '../providers/gemini.provider.js';
import { SecurityGuards } from '../rag/guards.js';
import { ragService } from '../rag/rag.service.js';
import { AssistantQuerySchema } from '../dto/assistant-query.dto.js';
import { assistantService } from '../assistant.service.js';
import { addisAiProvider } from '../providers/addis-ai.provider.js';

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

  console.log(`\n=== Test Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
