# GuzoMate Assistant Module

**Owner:** Member 2  
**Tech:** Node.js + Express + TypeScript + Google Gemini + PostGIS + pgvector

The **Assistant Module** powers the multilingual travel intelligence in GuzoMate (`POST /api/v1/assistant/query`), providing grounded, context-aware answers in English (`en`), Amharic (`am`), and Afaan Oromo (`om`).

---

## Key Features

1. **Strict Grounding (Zero Hallucination):** Answers are grounded strictly in structured evidence. Never fabricates opening hours, prices, or safety guarantees. Discloses missing data explicitly.
2. **PostGIS-First Retrieval:** Applies geographic radius filters on OpenStreetMap places and road incidents prior to semantic ranking.
3. **Multilingual by Design:** Auto-detects query language (Ethiopic script for Amharic, Latin markers for Afaan Oromo, English default) or respects user preference.
4. **Resilient Fallback:** Automatically degrades to return verified structured facts (places, weather, incidents) directly if the LLM provider times out or is unconfigured.

---

## Directory Layout

```
backend/src/modules/assistant/
├── dto/
│   ├── assistant-query.dto.ts       # Zod schema validation for query requests
│   ├── assistant-response.dto.ts    # Standard response interfaces (GuzoMate API Reference)
│   └── errors.ts                    # Standard API error definitions
├── intent/
│   ├── language.detector.ts         # Language detection (en, am, om)
│   ├── intent.classifier.ts         # Intent identification & entity parsing
│   └── intent.types.ts              # Intent definitions
├── rag/
│   ├── rag.service.ts               # PostGIS + pgvector + weather retrieval
│   ├── context.builder.ts           # Evidence context compiler
│   ├── prompt.templates.ts          # Multilingual system prompts & grounding rules
│   └── guards.ts                    # Prompt injection sanitization & answer guards
├── providers/
│   ├── gemini.provider.ts           # Gemini 2.5/Flash provider with timeout & retries
│   └── embedding.provider.ts        # Vector embedding provider (text-embedding-004)
├── assistant.service.ts             # Main orchestrator (intent -> RAG -> Gemini -> response)
├── assistant.controller.ts          # Express controller handling validation & errors
├── assistant.routes.ts              # Route definition (POST /assistant/query)
└── __tests__/
    └── assistant.test.ts            # Unit and integration test suite
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
