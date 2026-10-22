# GuzoMate — System Folder Architecture and Member Responsibilities

This document defines the proposed folder architecture for GuzoMate — Travelers Assistance and explains exactly which folders each of the five team members should work on.

The goal is to let all five members develop their features independently while keeping the system organized and easy to integrate.

## 1. Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React + TypeScript + Motion |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + PostGIS + pgvector |
| Map and place data | OpenStreetMap (OSM) |
| Routing | Addis Transit |
| AI assistant | Gemini + RAG |
| Weather | WeatherAPI |
| Speech | Addis AI |
| Supported languages | English, Amharic, Afaan Oromo |

> **Note:** Verify Addis Transit and Addis AI's actual API capabilities, access requirements, and supported languages before implementing features that depend on them.

## 2. Complete System Folder Architecture

We recommend using a monorepo, meaning the frontend, backend, database scripts, shared API contracts, and documentation live in one Git repository.

```
guzomate/
│
├── README.md
├── .gitignore
├── .env.example
├── package.json
│
├── docs/
│   ├── SRS.md
│   ├── API_REFERENCE.md
│   ├── SYSTEM_WORKFLOW.md
│   ├── FOLDER_ARCHITECTURE.md
│   └── database/
│       ├── ERD.md
│       └── spatial-data-notes.md
│
├── frontend/                         # MEMBER 5
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   │
│   ├── public/
│   │   ├── icons/
│   │   └── images/
│   │
│   └── src/
│       ├── app/
│       │   ├── App.tsx
│       │   ├── router.tsx
│       │   └── providers.tsx
│       │
│       ├── components/
│       │   ├── layout/
│       │   ├── map/
│       │   ├── places/
│       │   ├── chat/
│       │   ├── weather/
│       │   ├── routes/
│       │   ├── incidents/
│       │   └── common/
│       │
│       ├── features/
│       │   ├── assistant/
│       │   ├── nearby-places/
│       │   ├── routing/
│       │   ├── weather/
│       │   ├── incidents/
│       │   ├── saved-places/
│       │   └── settings/
│       │
│       ├── hooks/
│       ├── lib/
│       │   ├── api-client.ts
│       │   ├── i18n.ts
│       │   └── motion.ts
│       │
│       ├── locales/
│       │   ├── en/
│       │   ├── am/
│       │   └── om/
│       │
│       ├── services/
│       ├── styles/
│       ├── types/
│       └── tests/
│           ├── unit/
│           └── e2e/
│
├── backend/                          # MEMBERS 1–4
│   ├── package.json
│   ├── tsconfig.json
│   │
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   ├── database.ts
│   │   │   └── providers.ts
│   │
│   │   ├── routes/
│   │   │   └── index.ts
│   │
│   │   ├── middleware/
│   │   │   ├── error-handler.ts
│   │   │   ├── not-found.ts
│   │   │   └── request-validation.ts
│   │
│   │   ├── common/
│   │   │   ├── errors/
│   │   │   ├── http/
│   │   │   ├── logging/
│   │   │   ├── validation/
│   │   │   └── types/
│   │
│   │   ├── modules/
│   │   │
│   │   │   ├── places/               # MEMBER 1
│   │   │   │   ├── places.routes.ts
│   │   │   │   ├── places.controller.ts
│   │   │   │   ├── places.service.ts
│   │   │   │   ├── places.repository.ts
│   │   │   │   ├── places.validation.ts
│   │   │   │   ├── providers/
│   │   │   │   │   └── osm.provider.ts
│   │   │   │   └── tests/
│   │   │
│   │   │   ├── assistant/            # MEMBER 2
│   │   │   │   ├── assistant.routes.ts
│   │   │   │   ├── assistant.controller.ts
│   │   │   │   ├── assistant.service.ts
│   │   │   │   ├── intent/
│   │   │   │   ├── rag/
│   │   │   │   ├── embeddings/
│   │   │   │   ├── providers/
│   │   │   │   │   └── gemini.provider.ts
│   │   │   │   ├── assistant.validation.ts
│   │   │   │   └── tests/
│   │   │
│   │   │   ├── travel-services/      # MEMBER 3
│   │   │   │   ├── travel-services.routes.ts
│   │   │   │   ├── weather/
│   │   │   │   │   ├── weather.controller.ts
│   │   │   │   │   ├── weather.service.ts
│   │   │   │   │   └── weatherapi.provider.ts
│   │   │   │   ├── routing/
│   │   │   │   │   ├── routing.controller.ts
│   │   │   │   │   ├── routing.service.ts
│   │   │   │   │   └── addis-transit.provider.ts
│   │   │   │   ├── speech/
│   │   │   │   │   ├── speech.controller.ts
│   │   │   │   │   ├── speech.service.ts
│   │   │   │   │   └── addis-ai.provider.ts
│   │   │   │   └── tests/
│   │   │
│   │   │   └── incidents/            # MEMBER 4
│   │   │       ├── incidents.routes.ts
│   │   │       ├── incidents.controller.ts
│   │   │       ├── incidents.service.ts
│   │   │       ├── incidents.repository.ts
│   │   │       ├── incidents.validation.ts
│   │   │       ├── moderation/
│   │   │       ├── notifications/
│   │   │       └── tests/
│   │
│   │   └── tests/
│   │       ├── integration/
│   │       └── fixtures/
│   │
│   └── database/
│       ├── migrations/
│       ├── seeds/
│       ├── extensions.sql
│       └── README.md
│
├── ai-ml/                            # MEMBER 2
│   ├── src/
│   │   ├── rag/
│   │   │   ├── pipeline/
│   │   │   ├── retrieval/
│   │   │   ├── ranking/
│   │   │   ├── prompts/
│   │   │   └── guards/
│   │   ├── embeddings/
│   │   │   ├── models/
│   │   │   └── loaders/
│   │   ├── datasets/
│   │   ├── eval/
│   │   ├── notebooks/
│   │   └── tests/
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── README.md
│
├── shared/
│   └── contracts/
│       └── src/
│           ├── places.ts
│           ├── assistant.ts
│           ├── travel-services.ts
│           ├── incidents.ts
│           └── index.ts
│
├── scripts/
│   ├── dev-check.sh
│   └── seed-dev-data.ts
│
└── .github/
    └── workflows/
        └── ci.yml
```

> This is the recommended structure, not a requirement to create every file immediately. Create files as features are implemented. Choose one database migration strategy, such as Prisma migrations or SQL migrations, instead of maintaining two competing systems.

---

## 3. Member 1 — OpenStreetMap and Nearby Services

**Backend: Places module**

**Main folders owned:**
- `backend/src/modules/places/`
- `backend/src/modules/places/tests/`
- `database/migrations/` — Place-related migrations

### Responsibilities

1. Integrate OpenStreetMap through `providers/osm.provider.ts`.
2. Retrieve and normalize location and place data.
3. Support nearby services such as:
   - Hospitals and clinics
   - Pharmacies
   - Hotels
   - Restaurants
   - Fuel stations
   - Other agreed service categories
4. Design the places database schema.
5. Store and query geographic coordinates using PostGIS.
6. Implement nearby-place search by distance and category.
7. Implement place details and search APIs.
8. Write tests for place searching and spatial queries.

### Expected Deliverables

- OSM integration module.
- Places database schema and migrations.
- PostGIS nearby-search functionality.
- Place-search and place-detail APIs.
- Tests and API documentation.

> **Important:** Member 1 provides reliable place data to Member 2's AI assistant and Member 5's frontend.

---

## 4. Member 2 — Multilingual AI Assistant and RAG

**Backend: Assistant module**

**Main folders owned:**
- `ai-ml/src/`
- `ai-ml/src/rag/`
- `ai-ml/tests/`

### Responsibilities

1. Integrate Gemini through `providers/gemini.provider.ts`.
2. Support English, Amharic, and Afaan Oromo, validated through testing.
3. Identify the user's language and intent.
4. Implement the assistant query workflow.
5. Implement RAG (Retrieval-Augmented Generation).
6. Use pgvector for semantic retrieval of suitable reference content.
7. Obtain relevant place, weather, route, and incident information through the other modules' agreed interfaces.
8. Ground responses in retrieved information and avoid inventing live facts.
9. Include sources where available and communicate uncertainty.
10. Test multilingual prompts, retrieval, and provider failures.

### Expected Deliverables

- Gemini integration.
- Language and intent handling.
- RAG and embedding/retrieval components.
- Assistant API.
- Multilingual and failure-handling tests.

### Main Dependency

Member 2 depends on Members 1, 3, and 4 for live service data. To avoid blocking development, use mock responses until those modules are ready.

---

## 5. Member 3 — Weather, Routing, and Speech

**Backend: Travel services module**

**Main folders owned:**
- `backend/src/modules/travel-services/`
- `backend/src/modules/travel-services/tests/`

### Responsibilities

#### Weather
- Integrate WeatherAPI.
- Retrieve current weather and forecast data.
- Provide weather advice based on the user's expected arrival time when suitable forecast data is available.
- Cache responses when appropriate.

#### Routing
- Investigate and verify Addis Transit API capabilities.
- Implement the routing provider adapter.
- Normalize route information for the frontend and AI assistant.
- Handle unavailable or incomplete route data.

#### Speech
- Verify Addis AI's supported speech operations and languages.
- Implement supported speech-to-text and/or text-to-speech features.
- Return clear errors for unsupported languages or unavailable services.

#### Reliability
- Handle API timeouts, rate limits, and provider errors.
- Keep provider-specific logic inside the appropriate adapter.
- Document endpoint request and response structures.

### Expected Deliverables

- Weather and forecast APIs.
- Arrival-weather advice API.
- Routing API, if the provider supports the required functionality.
- Supported speech APIs.
- Tests and provider setup documentation.

---

## 6. Member 4 — Road Incidents and Notifications

**Backend: Incidents module**

**Main folders owned:**
- `backend/src/modules/incidents/`
- `backend/src/modules/incidents/tests/`
- `database/migrations/` — Incident and notification migrations

### Responsibilities

1. Design the road incident database schema.
2. Implement incident submission with type, description, location, and timestamp.
3. Support incident categories such as:
   - Accidents
   - Road closures
   - Flooding
   - Construction
   - Road damage
4. Implement nearby-incident searches using PostGIS.
5. Implement incident detail and status endpoints.
6. Add duplicate-report handling and report-expiry rules.
7. Implement moderation and verification status.
8. Implement notification preferences and background notification jobs using an agreed notification provider.
9. Provide incident data for the map and AI assistant.
10. Test validation, spatial searches, moderation, and notification behavior.

### Expected Deliverables

- Incident submission and search APIs.
- Incident database schema.
- Moderation and verification logic.
- Notification and expiry services.
- Tests and API documentation.

> **Safety requirement:** New community reports should be marked unverified until reviewed or corroborated. The interface should show report age and verification status.

---

## 7. Member 5 — Frontend and User Experience

**Frontend: React application**

**Main folder owned:**
- `frontend/`

### Responsibilities

1. Build the React + TypeScript application structure.
2. Implement the main application layout and navigation.
3. Build the map interface and nearby-service results.
4. Display routes and weather information.
5. Build the multilingual AI chat interface.
6. Build incident reporting forms and incident map/list views.
7. Implement saved locations and user preferences.
8. Add English, Amharic, and Afaan Oromo interface translations.
9. Add speech controls when the backend supports them.
10. Use Motion for appropriate transitions and respect reduced-motion settings.
11. Connect to backend endpoints through a typed API client.
12. Handle loading, error, empty, and offline states.
13. Write component and end-to-end tests.

### Expected Deliverables

- Working React frontend.
- Map and service-discovery interface.
- AI assistant interface.
- Route, weather, and incident screens.
- Multilingual interface.
- Backend API integration and frontend tests.

> **Important:** Member 5 owns the frontend, not all system integration. Every backend member must provide working, tested endpoints and help connect their feature.

---

## 8. Shared Folders and Responsibilities

Some folders cannot belong exclusively to one member because changes affect the whole system.

| Folder | Responsibility |
|--------|---------------|
| `docs/` | All members maintain documentation for their features. |
| `backend/src/config/` | Shared backend configuration; changes must be coordinated. |
| `backend/src/common/` | Shared error handling, logging, validation, and utilities. |
| `backend/src/routes/index.ts` | Backend integration owner mounts routes exported by each module. |
| `shared/contracts/` | Team-agreed API request and response types. |
| `database/migrations/` | Each member prepares migrations for their feature; the team reviews conflicts. |
| `.env.example` | All members document required environment variable names. Never put real secrets here. |
| `.github/workflows/` | A team-agreed maintainer configures automated checks and tests. |

### How Shared Work Should Be Handled

- Discuss shared changes before modifying them.
- Each feature owner proposes API and database changes for their module.
- Agree on API contracts before implementing features that depend on each other.
- Use code reviews before merging changes into the main branch.

---

## 9. Proposed API Ownership

These are internal GuzoMate endpoints, not the external providers' own API URLs.

| Member | Example Endpoints |
|--------|------------------|
| Member 1 — Places | `GET /api/v1/places/nearby`, `GET /api/v1/places/:id` |
| Member 2 — AI | `POST /api/v1/assistant/query` |
| Member 3 — Travel services | `GET /api/v1/weather`, `GET /api/v1/weather/arrival`, `POST /api/v1/routes` |
| Member 3 — Speech | `POST /api/v1/speech/transcribe`, `POST /api/v1/speech/synthesize` (only if supported) |
| Member 4 — Incidents | `POST /api/v1/incidents`, `GET /api/v1/incidents/nearby`, `GET /api/v1/incidents/:id` |
| Member 5 — Frontend | Consumes the endpoints above through the API client. |

The exact request and response formats should be agreed upon and documented in `docs/API_REFERENCE.md` before implementation.

---

## 10. How the Team Should Work Together

### Step 1 — Agree on API Contracts

Before backend development starts in parallel, agree on what each endpoint receives and returns. Put shared TypeScript types in `shared/contracts/` if you decide to use a shared package.

### Step 2 — Use Separate Git Branches

For example:

```
main
├── feature/places
├── feature/assistant
├── feature/travel-services
├── feature/incidents
└── feature/frontend
```

Each member commits to their feature branch and opens a pull request for review.

### Step 3 — Keep Feature Code Separated

- Member 1 changes `modules/places/`.
- Member 2 changes `modules/assistant/`.
- Member 3 changes `modules/travel-services/`.
- Member 4 changes `modules/incidents/`.
- Member 5 changes `frontend/`.

Coordinate first when a task needs changes in another member's module.

### Step 4 — Use Mock Data Where Needed

Member 5 can develop the frontend with mock API responses while the backend modules are being implemented. Member 2 can also use mock place, weather, route, and incident services while waiting for real integrations.

### Step 5 — Test Before Merging

Each member should provide:

- Unit tests for their own logic.
- Integration tests for API and database behavior where applicable.
- Example API requests and responses.
- Required environment variable names.
- Setup instructions.

Run formatting, linting, TypeScript checks, and tests before merging.

---

## 11. Definition of Done for Each Member

A feature is ready for integration when:

- Its code is in the agreed folders.
- It follows the documented API contracts.
- It validates inputs and handles expected errors.
- It has relevant tests.
- It does not contain committed API keys or secrets.
- Its setup requirements are documented.
- It can be run and reviewed by another team member.

---

## 12. Important Technical Notes

- **OSM:** Follow applicable attribution and Open Database License requirements. Choose an access method suitable for your expected traffic.
- **PostGIS:** Use for geographic searches and distance calculations.
- **pgvector:** Use for semantic retrieval; it does not replace routing calculations or live weather data.
- **External providers:** Verify authentication, quotas, licensing, availability, and language support before depending on a feature.
- **Security:** Validate user input, rate-limit public endpoints, protect moderation actions, and never expose provider secrets to the frontend.
- **Incident reliability:** Display report age and verification status so unverified reports are not mistaken for confirmed facts.