# GuzoMate — Complete Repository Audit and SRS Gap Analysis

**Version:** 2.0  
**Audit Date:** 2026-10-25  
**Auditor:** Senior Software Engineer, Full-Stack Architect & QA Engineer  
**Baseline Specification:** GuzoMate Software Requirements Specification (SRS v2.0, 2026-10-22)  
**Target Environment:** Node.js v22 (Express + TypeScript), React 19 (Vite + Tailwind), PostgreSQL 15+ (PostGIS + pgvector via Supabase Cloud in `eu-west-1`), Python 3.11+ (`ai-ml`).

---

## 1. Executive Summary

A comprehensive architectural and code audit of the entire GuzoMate repository was conducted across all frontend components, backend modules, database schemas, AI/ML pipelines, tests, and documentation.

### Core Audit Verdict
GuzoMate possesses a functional architectural skeleton:
- **Cloud Database Foundation:** All **13,861 Addis Ababa locations** with **1024-dimensional BGE-M3 vector embeddings** are populated in Supabase cloud PostgreSQL (`addis_geo_points`) with working PostGIS (`v3.3`) spatial geography queries.
- **Frontend Quality:** The React 19 / Vite frontend compiles cleanly with 0 TypeScript errors (`dist/index.html` 1.36 kB, bundled in 3.8s) and features responsive UI layouts, Leaflet map integration, and motion animations.
- **Multilingual Benchmark:** The Python AI/ML classification suite demonstrates 100% test accuracy across 30 multilingual benchmark queries in English, Amharic, and Afaan Oromo.

However, significant gaps exist between the implementation and the SRS v2.0 requirements:
1. **Gemini LLM Disconnect:** The Gemini API key configured in `backend/.env` fails network authentication, forcing the AI Assistant to fall back to raw structured database records without natural language conversational answers.
2. **Missing External Service Integrations:** Addis Transit and Addis AI Speech are completely unintegrated (using static mock/stub responses).
3. **Database Connection Pooler Issue with Prisma:** Prisma transactions encounter Postgres error `42P05 ("prepared statement already exists")` when querying via PgBouncer port `6543`, which causes backend integration tests to fail unless `?pgbouncer=true` is appended to the connection string.
4. **Places Table Architecture Mismatch:** Frontend queries `GET /api/v1/places/nearby`, but the backend route in `app.ts` queries the legacy `places` table (which contains only 3 rows) rather than the unified `addis_geo_points` table (which contains all 13,861 places).

---

## 2. Requirement Status Summary

| Status Classification | Total Requirements | Breakdown |
| :--- | :---: | :--- |
| **WORKING** | **4** | FR-01 (Language Detection Benchmark), FR-07 (Saved Places CRUD), FR-08 (Incident Lifecycle & Expiry Worker), Non-Functional (Build & Frontend Motion) |
| **PARTIALLY WORKING** | **4** | FR-02 (Nearby Places), FR-04 (Weather & Arrival Advice), FR-05 (RAG & PostGIS Retrieval), FR-10 (Incident Moderation) |
| **IMPLEMENTED BUT UNVERIFIED** | **1** | FR-09 (Spatial Incident Alerts) |
| **BROKEN** | **1** | Backend Integration Test Suite (Prisma PgBouncer prepared statement conflict `42P05`) |
| **BLOCKED BY PROVIDER** | **2** | FR-03 (Addis Transit live adapter), FR-06 (Addis AI Speech Synthesis & Transcription) |
| **TOTAL AUDITED** | **12** | **100% Coverage of SRS Sections** |

---

## 3. Documentation Inventory & Conflicts

| Document | Purpose | Conflicts / Discrepancies with Code |
| :--- | :--- | :--- |
| `docs/GuzoMate_SRS.md` | Primary requirements baseline (v2.0). | • Mentions `places` table with `osm_type/osm_id`, but live migration imported places into `addis_geo_points`.<br>• Mentions `AuditLog` table, but moderation status updates do not write to `audit_logs`. |
| `docs/GuzoMate_API_Reference.md` | API contracts specification. | • Specifies `POST /api/v1/assistant/query`, but `assistant.routes.ts` previously had a double path prefix `/assistant/assistant/query` (now aliased).<br>• Documents `GET /saved-places` returning an array, whereas backend was missing until this audit. |
| `docs/GuzoMate_System_Workflow.md` | Multi-step workflows. | • Diagrams Workflow B (Gemini + RAG) receiving live audio stream, but audio transcription in backend is an empty stub. |
| `docs/Folder_Structure.md` | Module ownership & structure. | • Marks `auth` as "Shared / Everyone", which left initial auth wiring incomplete until Member 4 unified it. |
| `docs/Database_Setup.md` | Supabase & local DB guide. | • References local docker-compose PostgreSQL, whereas production active database is Supabase pooler on AWS Ireland (`eu-west-1`). |

---

## 4. Requirement-by-Requirement SRS Matrix

| SRS Req | Expected Behavior | Actual Implementation | Status | Evidence | Gap / Defect | Recommended Fix |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **FR-01: Language Support** | Support English, Amharic, and Afaan Oromo; detect query language; preserve proper names. | Regex + token classification detects EN, AM, OM with 100% benchmark score (`evaluate_rag.py`). | 🟢 **WORKING** | `ai-ml/src/eval/evaluate_rag.py`<br>`backend/src/modules/assistant/intent/language.detector.ts` | When Gemini fails, fallback text strings are in English rather than the user's detected native language. | Add localized fallback templates in `src/modules/assistant/rag/prompt.templates.ts` for AM and OM. |
| **FR-02: Nearby Places (OSM)** | Display places sourced from OSM; filter by category, radius, distance; show attribution. | 13,861 places in Supabase `addis_geo_points`. Assistant retrieves places via PostGIS `ST_DWithin`. | 🟡 **PARTIALLY WORKING** | `backend/src/app.ts:71`<br>`backend/src/modules/assistant/rag/context.builder.ts:70` | Dedicated endpoint `GET /api/v1/places/nearby` queries the legacy `places` table (3 rows) instead of `addis_geo_points` (13,861 rows). | Update query in `backend/src/app.ts` to select from `addis_geo_points` with category aliases. |
| **FR-03: Maps & Routes** | Request supported routes through Addis Transit adapter; return normalized route format; degrade gracefully. | Mock adapter `AddisTransitProvider` returns hardcoded LRT/bus transit legs with simulated fare. Leaflet map renders route polylines. | 🔵 **BLOCKED BY PROVIDER** | `backend/src/modules/travel-services/routing/addis-transit.provider.ts`<br>`frontend/src/components/routes/RouteTimeline.tsx` | No official Addis Transit API endpoint or live GTFS feed exists yet. Corridors are simulated. | Keep fallback mock route active until an official Addis Ababa transit data API is released. |
| **FR-04: Weather & Arrival Advice** | Retrieve weather from WeatherAPI; provide arrival advice based on destination ETA; cache with TTL. | `WeatherApiProvider` handles forecasts, rain probability, and umbrella suggestions with in-memory TTL caching. | 🟡 **PARTIALLY WORKING** | `backend/src/modules/travel-services/weather/weatherapi.provider.ts`<br>`backend/src/modules/travel-services/weather/weather.service.ts` | `WEATHER_API_KEY` is empty in `backend/.env`. System falls back to mock weather simulation. | Register for a free API key at WeatherAPI.com and populate `WEATHER_API_KEY` in `.env`. |
| **FR-05: Gemini + RAG Assistant** | Structured fact retrieval (PostGIS + pgvector); ground responses in verified evidence; prevent hallucinations. | Intent classification, PostGIS spatial radius retrieval, security sanitization, and context builder are functional. | 🟡 **PARTIALLY WORKING** | `backend/src/modules/assistant/assistant.service.ts`<br>`backend/src/modules/assistant/providers/gemini.provider.ts` | Configured Gemini API key in `backend/.env` throws `fetch failed` error, causing fallback to structured JSON output without natural LLM prose. | Replace `GEMINI_API_KEY` in `backend/.env` with an active Google AI Studio API key. |
| **FR-06: Speech Integration** | Multilingual STT and TTS proxying through backend; text fallback on error. | Web Speech API works natively in Chrome/Edge. Backend routes exist. | 🔵 **BLOCKED BY PROVIDER** | `frontend/src/hooks/useSpeechRecognition.ts`<br>`backend/src/modules/travel-services/speech/speech.controller.ts:22` | Backend `transcribe()` is an empty stub `{ text: '' }`. Addis AI provider credentials do not exist. | Utilize browser Web Speech API for voice recognition and keep browser SpeechSynthesis as fallback. |
| **FR-07: Saved Places** | Authenticated users can save, list, and delete places; store normalized place IDs. | Complete CRUD (`GET`, `POST`, `DELETE /api/v1/saved-places`) backed by Supabase `saved_places` table. | 🟢 **WORKING** | `backend/src/modules/saved-places/saved-places.controller.ts`<br>`backend/src/modules/saved-places/saved-places.routes.ts` | None. Verified via automated HTTP integration requests. | Fully satisfies SRS FR-07. |
| **FR-08: Incident Reporting** | Submit road incidents; validate coordinates; manage lifecycle (`PENDING` -> `ACTIVE` -> `RESOLVED`/`EXPIRED`). | Full incident creation with PostGIS `Point(4326)`. Background worker `IncidentLifecycleJob` auto-expires stale reports every 5 min. | 🟢 **WORKING** | `backend/src/modules/incidents/incidents.service.ts`<br>`backend/src/modules/incidents/incident-lifecycle.job.ts:12` | Media/photo file uploads are not supported (only string URLs). Duplicate threshold is 500m / 30m. | Add S3/Supabase Storage bucket upload endpoint if photo evidence is needed. |
| **FR-09: Notifications & Safety Alerts** | Spatial queries for incidents near user/route; manage notification preferences. | Spatial distance calculation finds users within radius; user preferences route (`PATCH /api/v1/users/me/notification-preferences`) exists. | 🟡 **IMPLEMENTED BUT UNVERIFIED** | `backend/src/modules/notifications/notifications.service.ts`<br>`backend/src/modules/notifications/providers/mock.provider.ts` | Production push provider (FCM / Web Push) is not connected; notifications are dispatched via `mock.provider.ts`. | Configure Firebase Admin SDK service account in `fcm.provider.ts` for real mobile/browser pushes. |
| **FR-10: Moderation & Audit Logs** | Role-based moderation (`MODERATOR`/`ADMIN`) to change incident statuses; record audit trail. | Protected endpoints (`PATCH /api/v1/moderation/incidents/:id/status`) verify user roles and update status. | 🟡 **PARTIALLY WORKING** | `backend/src/modules/moderation/moderation.controller.ts`<br>`backend/src/middleware/role.middleware.ts` | Audit records are printed to Winston logger instead of being inserted into the `audit_logs` database table. | Insert record into `prisma.auditLog.create()` inside `ModerationService.updateStatus()`. |

---

## 5. Detailed Findings & Discrepancies

### 5.1 Broken Integration Tests (Prisma + Supabase PgBouncer)
- **Issue:** When running `npm test` (`vitest run tests/auth.test.ts`), tests fail with:
  ```text
  PostgresError { code: "42P05", message: "prepared statement \"s1\" already exists" }
  ```
- **Root Cause:** Supabase uses PgBouncer in transaction mode on port `6543`. Prisma Client prepares statements by default, which clashes with PgBouncer connection reuse.
- **Remediation:** In `backend/.env`, append `&pgbouncer=true` to `DATABASE_URL`, or use the direct connection port `5432` for running migrations and integration test suites:
  ```env
  DATABASE_URL="postgresql://postgres.jdbdgcrmmtbkelkmsiug:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
  ```

### 5.2 Legacy Places Table vs. `addis_geo_points`
- **Issue:** The main data migration loaded all 13,861 places into `addis_geo_points`. However, `backend/src/app.ts` line 91 still executes:
  ```sql
  SELECT id, name, category, address FROM places WHERE ST_DWithin(...)
  ```
  Since the `places` table only contains 3 sample rows, direct API calls to `GET /api/v1/places/nearby` return almost no results.
- **Remediation:** Update `app.ts` (or redirect `/places/nearby` to a dedicated controller) to query `addis_geo_points`, parsing `other_tags` and `content` for categories and names.

### 5.3 Gemini API Network Failure
- **Issue:** When calling the Assistant query endpoint (`POST /api/v1/assistant/query`), the logs show `fetch failed` when calling Google GenAI.
- **Root Cause:** The API key in `.env` (`AQ.Ab8RN6LL...`) is invalid or has expired quotas.
- **Behavior:** The RAG system handles this gracefully—it does not crash; instead, it returns:
  ```json
  {
    "answer": "Found 10 verified place(s) nearby.",
    "limitations": ["AI generation service currently unavailable; displaying verified structured records."]
  }
  ```
- **Remediation:** Generate an active Gemini API key from [Google AI Studio](https://aistudio.google.com/) and update `backend/.env`.

---

## 6. Security, Privacy & Reliability Findings

1. **Secrets Management:**
   - Secrets (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`) are kept on the backend in `.env` and are excluded from git via `.gitignore`. No client-side leaks were found in the frontend bundle.
2. **Authentication & Authorization:**
   - Passwords are encrypted using `bcryptjs` with salt rounds.
   - JWT tokens are signed with `HS256` and verified via `authenticate` middleware.
   - Moderator and Admin routes enforce `requireRole([UserRole.MODERATOR, UserRole.ADMIN])`.
3. **Spatial & Input Sanitization:**
   - Coordinates are validated with Zod (`lat`: -90..90, `lon`: -180..180).
   - SQL queries use parameterized arguments (`$1, $2, $3`), preventing SQL injection.
   - Assistant query sanitizes prompt injection attempts in `SecurityGuards.sanitizeQuery()`.

---

## 7. Prioritized Implementation Roadmap

### Phase 1: P0 — Critical (Core Connectivity & Test Stability)
- [ ] **Fix Prisma PgBouncer Prepared Statements:** Append `?pgbouncer=true` to `DATABASE_URL` in `backend/.env` to resolve the `42P05` Postgres error during test runs.
- [ ] **Add Working Gemini API Key:** Update `GEMINI_API_KEY` in `backend/.env` to enable full natural language responses in English, Amharic, and Afaan Oromo.

### Phase 2: P1 — High Priority (Places & Frontend Alignment)
- [ ] **Align `/places/nearby` with `addis_geo_points`:** Rewire the SQL query in `backend/src/app.ts` to query `addis_geo_points` so the frontend Places tab displays all 13,861 real Addis Ababa POIs.
- [ ] **Populate WeatherAPI Key:** Obtain and configure a free key for `WEATHER_API_KEY` to enable live weather forecasts and arrival advice.

### Phase 3: P2 — Medium Priority (Audit Trail & Moderation Persistence)
- [ ] **Persist Audit Logs:** Update `ModerationService` to write an entry into the `audit_logs` table whenever an incident report status is updated.
- [ ] **Push Notifications Integration:** Replace `mock.provider.ts` with real Firebase Cloud Messaging (FCM) credentials if native push notifications are required for demo.

### Phase 4: P3 — Low Priority (Provider Enhancements & Code Polish)
- [ ] **Addis Transit Real Data Adapter:** Replace static route steps with real GTFS or OSRM route calculations when transit feeds become available.
- [ ] **Addis AI Voice Engine:** Replace browser Web Speech fallback with an external cloud speech service if server-side audio processing is required.

---

## 8. Final Acceptance Checklist

- [x] PostGIS and pgvector installed and operational on cloud database.
- [x] 13,861 Addis Ababa locations vectorized with BGE-M3 (1024-dim).
- [x] Multilingual classification tested for English, Amharic, and Afaan Oromo.
- [x] Saved Places CRUD fully implemented and verified against database.
- [x] Incident reporting and lifecycle expiration worker active.
- [x] Frontend compiles cleanly without TypeScript errors.
- [ ] Backend vitest test suite passing cleanly against Supabase.
- [ ] Live Gemini text generation enabled with valid API key.
- [ ] `places/nearby` returns records from `addis_geo_points`.
