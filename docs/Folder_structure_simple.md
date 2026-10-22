# GuzoMate — Simple Folder Structure

## Quick Overview

The project has **3 main folders** + supporting folders:

```
guzomate/
├── frontend/       → React app (what users see)
├── backend/        → Express API (server logic)
├── ai-ml/          → Python AI & RAG (smart assistant)
├── shared/         → Types shared between frontend & backend
├── docs/           → Documentation
├── scripts/        → Dev helper scripts
└── .github/        → CI/CD workflows
```

---

## 1. Frontend (`frontend/`)

**Tech:** React + TypeScript + Vite + Motion  
**Owner:** Member 5

```
frontend/
├── public/                → Static files (icons, images)
└── src/
    ├── app/               → App.tsx, router, providers
    ├── components/        → UI components
    │   ├── layout/        →   Header, sidebar, footer
    │   ├── map/           →   Map display
    │   ├── places/        →   Place cards
    │   ├── chat/          →   AI chat interface
    │   ├── weather/       →   Weather widgets
    │   ├── routes/        →   Route display
    │   ├── incidents/     →   Incident reporting UI
    │   └── common/        →   Buttons, inputs, etc.
    ├── features/          → Feature logic
    │   ├── assistant/     →   AI chat logic
    │   ├── nearby-places/ →   Place search logic
    │   ├── routing/       →   Route planning
    │   ├── weather/       →   Weather logic
    │   ├── incidents/     →   Incident logic
    │   ├── saved-places/  →   Bookmarks
    │   └── settings/      →   User preferences
    ├── hooks/             → Custom React hooks
    ├── lib/               → Utilities (API client, i18n, motion)
    ├── locales/           → Translations (en, am, om)
    ├── services/          → API call functions
    ├── styles/            → CSS / global styles
    ├── types/             → TypeScript types
    └── tests/             → Unit & e2e tests
```

---

## 2. Backend (`backend/`)

**Tech:** Node.js + Express + TypeScript  
**Owners:** Members 1–4

```
backend/
├── src/
│   ├── app.ts             → Express app setup
│   ├── server.ts          → Start the server
│   ├── config/            → Environment, database, provider settings
│   ├── routes/            → Main route file (connects all modules)
│   ├── middleware/         → Error handling, validation
│   ├── common/            → Shared errors, logging, types
│   │
│   └── modules/           → ⭐ Each module = one team member's work
│       │
│       ├── places/        → Member 1: Find nearby places (OSM)
│       │   ├── places.routes.ts
│       │   ├── places.controller.ts
│       │   ├── places.service.ts
│       │   ├── places.repository.ts
│       │   └── providers/osm.provider.ts
│       │
│       ├── assistant/     → Member 2: AI assistant (Gemini + RAG)
│       │   ├── assistant.routes.ts
│       │   ├── assistant.controller.ts
│       │   ├── assistant.service.ts
│       │   ├── intent/
│       │   ├── rag/
│       │   └── providers/gemini.provider.ts
│       │
│       ├── travel-services/ → Member 3: Weather + Routes + Speech
│       │   ├── weather/
│       │   │   ├── weather.controller.ts
│       │   │   ├── weather.service.ts
│       │   │   └── weatherapi.provider.ts
│       │   ├── routing/
│       │   │   ├── routing.controller.ts
│       │   │   ├── routing.service.ts
│       │   │   └── addis-transit.provider.ts
│       │   └── speech/
│       │       ├── speech.controller.ts
│       │       ├── speech.service.ts
│       │       └── addis-ai.provider.ts
│       │
│       └── incidents/     → Member 4: Road incidents + notifications
│           ├── incidents.routes.ts
│           ├── incidents.controller.ts
│           ├── incidents.service.ts
│           ├── incidents.repository.ts
│           ├── moderation/
│           └── notifications/
│
└── database/
    ├── migrations/        → Database schema changes
    ├── seeds/             → Test data
    └── extensions.sql     → Enable PostGIS + pgvector
```

**How each module works (same pattern):**

```
User Request → Route → Controller → Service → Repository / Provider
```

---

## 3. AI-ML (`ai-ml/`)

**Tech:** Python  
**Owner:** Member 2

```
ai-ml/
├── src/
│   ├── rag/               → RAG pipeline
│   │   ├── pipeline/      →   Orchestration
│   │   ├── retrieval/     →   Vector search (pgvector)
│   │   ├── ranking/       →   Re-rank results
│   │   ├── prompts/       →   Prompt templates
│   │   └── guards/        →   Safety & validation
│   ├── embeddings/        → Text-to-vector conversion
│   │   ├── models/        →   Model wrappers
│   │   └── loaders/       →   Data loaders
│   ├── datasets/          → Training & evaluation data
│   ├── eval/              → Test retrieval quality
│   ├── notebooks/         → Jupyter experiments
│   └── tests/             → Tests
├── requirements.txt
└── pyproject.toml
```

---

## 4. Shared & Support Folders

```
shared/contracts/src/      → TypeScript types used by both frontend & backend
├── places.ts
├── assistant.ts
├── travel-services.ts
├── incidents.ts
└── index.ts

docs/                      → Project documentation (everyone maintains)
scripts/                   → Dev utilities
.github/workflows/         → CI/CD pipeline
```

---

## Who Works Where — Quick Reference

| Member | Folder | What They Build |
|--------|--------|----------------|
| Member 1 | `backend/src/modules/places/` | Nearby places using OpenStreetMap |
| Member 2 | `ai-ml/` + `backend/src/modules/assistant/` | AI assistant with Gemini + RAG |
| Member 3 | `backend/src/modules/travel-services/` | Weather, routing, speech |
| Member 4 | `backend/src/modules/incidents/` | Road incident reports & notifications |
| Member 5 | `frontend/` | Everything the user sees |
| Everyone | `docs/`, `shared/`, `config/` | Documentation & shared code |

---

## API Endpoints — Quick Reference

| What | Method | URL | Owner |
|------|--------|-----|-------|
| Find nearby places | GET | `/api/v1/places/nearby` | Member 1 |
| Place details | GET | `/api/v1/places/:id` | Member 1 |
| Ask AI assistant | POST | `/api/v1/assistant/query` | Member 2 |
| Current weather | GET | `/api/v1/weather/current` | Member 3 |
| Weather forecast | GET | `/api/v1/weather/forecast` | Member 3 |
| Arrival advice | GET | `/api/v1/weather/arrival-advice` | Member 3 |
| Get routes | GET | `/api/v1/routes` | Member 3 |
| Speech to text | POST | `/api/v1/speech/transcriptions` | Member 3 |
| Text to speech | POST | `/api/v1/speech/synthesis` | Member 3 |
| Report incident | POST | `/api/v1/incidents` | Member 4 |
| Nearby incidents | GET | `/api/v1/incidents/nearby` | Member 4 |
| Incident details | GET | `/api/v1/incidents/:id` | Member 4 |
| Register | POST | `/api/v1/auth/register` | Shared |
| Login | POST | `/api/v1/auth/login` | Shared |

---

## Database Tables — Quick Reference

| Table | Purpose |
|-------|---------|
| User | Accounts, roles, language preference |
| Place | OSM places with coordinates |
| SavedPlace | User's bookmarked places |
| Incident | Road incident reports |
| IncidentConfirmation | User confirmations of incidents |
| NotificationSubscription | Alert preferences |
| WeatherCache | Cached weather data |
| RagDocument | Embedded documents for AI search |
| AuditLog | Moderation action history |

---

## Git Branching

```
main
├── feature/places          → Member 1
├── feature/assistant       → Member 2
├── feature/travel-services → Member 3
├── feature/incidents       → Member 4
└── feature/frontend        → Member 5
```

Each member works on their own branch and opens a pull request to merge into `main`.
