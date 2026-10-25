# GuzoMate Assistant Module

**Owner:** Member 2  
**Tech:** Node.js + Express + TypeScript + Addis AI + Google Gemini + PostGIS + pgvector

The **Assistant Module** powers the multilingual travel intelligence in GuzoMate (`POST /api/v1/assistant/query`), providing grounded, context-aware answers in English (`en`), Amharic (`am`), and Afaan Oromo (`om`).

---

## Key Features

1. **Strict Grounding (Zero Hallucination):** Answers are grounded strictly in structured evidence retrieved from the database. Never fabricates opening hours, prices, or safety guarantees. Discloses missing data explicitly.
2. **PostGIS-First Retrieval:** Applies geographic radius filters on OpenStreetMap places and road incidents prior to semantic ranking.
3. **Addis AI Multilingual Intelligence:** Employs Addis AI's localized LLM (`addis-አሌፍ-፩`) and Google Gemini with strict zero-hallucination system instructions.
4. **Voice-First Audio Responses (Addis AI Voices 2):** Generates high-quality spoken audio clips for traveler answers in Amharic (`am-hamen`), Afaan Oromo (`om-bikila`), and English (`en-emma`), returning playback URLs and metadata.
5. **Direct Speech Synthesis:** Exposes `POST /api/v1/speech/synthesis` matching GuzoMate API Reference v2.0 Section 8.
6. **Resilient Fallback:** Automatically degrades to return verified structured facts (places, weather, incidents) directly if external AI services time out.

---

## Directory Layout

```
backend/src/modules/assistant/
├── dto/
│   ├── assistant-query.dto.ts       # Zod schema validation (supports enableVoice, voiceId)
│   ├── assistant-response.dto.ts    # Standard response interfaces with voice payload
│   └── errors.ts                    # Standard API error definitions
├── intent/
│   ├── language.detector.ts         # Language detection (en, am, om)
│   ├── intent.classifier.ts         # Intent identification & entity parsing
│   ├── intent.service.ts            # Intent & language orchestration
│   └── intent.types.ts              # Intent definitions
├── rag/
│   ├── rag.service.ts               # PostGIS + pgvector + weather evidence retrieval
│   ├── context.builder.ts           # Evidence context compiler
│   ├── prompt.templates.ts          # Multilingual system prompts & grounding rules
│   └── guards.ts                    # Prompt injection sanitization & answer guards
├── providers/
│   ├── addis-ai.provider.ts         # Addis AI LLM chat + Addis Voices 2 TTS synthesis
│   ├── gemini.provider.ts           # Gemini 2.5/Flash provider with timeout & retries
│   └── embedding.provider.ts        # Vector embedding provider
├── assistant.service.ts             # Orchestrator (Intent -> RAG -> Addis AI/Gemini -> Voice)
├── assistant.controller.ts          # Express controller handling validation & errors
├── assistant.routes.ts              # Routes (/assistant/query, /speech/synthesis)
└── __tests__/
    └── assistant.test.ts            # Unit and integration test suite (16 tests)
```

---

## Available Commands

From the `backend/` directory:

```bash
# Run unit and integration tests (14 test cases)
npm run test:assistant

# Seed & embed curated travel knowledge into PostgreSQL rag_documents
npm run seed:rag

# Build TypeScript to dist/
npm run build
```
