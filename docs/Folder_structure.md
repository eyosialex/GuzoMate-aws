1| GuzoMate — System Folder Architecture and Member Responsibilities
2| This document defines the proposed folder architecture for GuzoMate — Travelers Assistance and explains exactly which folders each of the five team members should work on.
3| 
4| The goal is to let all five members develop their features independently while keeping the system organized and easy to integrate.
5| 1. Technology stack
6| Component	Technology
7| Frontend	React + TypeScript + Motion
8| Backend	Node.js + Express + TypeScript
9| Database	PostgreSQL + PostGIS + pgvector
10| Map and place data	OpenStreetMap (OSM)
11| Routing	Addis Transit
12| AI assistant	Gemini + RAG
13| Weather	WeatherAPI
14| Speech	Addis AI
15| Supported languages	English, Amharic, Afaan Oromo
16| 
17| Note: Verify Addis Transit and Addis AI's actual API capabilities, access requirements, and supported languages before implementing features that depend on them.
18| 2. Complete system folder architecture
19| We recommend using a monorepo, meaning the frontend, backend, database scripts, shared API contracts, and documentation live in one Git repository.
20| guzomate/
21| │
22| ├── README.md
23| ├── .gitignore
24| ├── .env.example
25| ├── package.json
26| │
27| ├── docs/
28| │   ├── SRS.md
29| │   ├── API_REFERENCE.md
30| │   ├── SYSTEM_WORKFLOW.md
31| │   ├── FOLDER_ARCHITECTURE.md
32| │   └── database/
33| │       ├── ERD.md
34| │       └── spatial-data-notes.md
35| │
36| ├── frontend/                         # MEMBER 5
37| │   ├── package.json
38| │   ├── tsconfig.json
39| │   ├── vite.config.ts
40| │   │
41| │   ├── public/
42| │   │   ├── icons/
43| │   │   └── images/
44| │   │
45| │   └── src/
46| │       ├── app/
47| │       │   ├── App.tsx
48| │       │   ├── router.tsx
49| │       │   └── providers.tsx
50| │       │
51| │       ├── components/
52| │       │   ├── layout/
53| │       │   ├── map/
53| │       │   ├── places/
53| │       │   ├── chat/
53| │       │   ├── weather/
53| │       │   ├── routes/
53| │       │   ├── incidents/
53| │       │   └── common/
54| │       │
55| │       ├── features/
56| │       │   ├── assistant/
57| │       │   ├── nearby-places/
58| │       │   ├── routing/
59| │       │   ├── weather/
59| │       │   ├── incidents/
60| │       │   ├── saved-places/
61| │       │   └── settings/
62| │       │
63| │       ├── hooks/
64| │       ├── lib/
65| │       │   ├── api-client.ts
66| │       │   ├── i18n.ts
67| │       │   └── motion.ts
68| │       │
69| │       ├── locales/
70| │       │   ├── en/
71| │       │   ├── am/
72| │       │   └── om/
73| │       │
74| │       ├── services/
75| │       ├── styles/
76| │       ├── types/
77| │       └── tests/
78| │           ├── unit/
79| │           └── e2e/
80| │
81| ├── backend/                          # MEMBERS 1–4
82| │   ├── package.json
83| │   ├── tsconfig.json
84| │   │
85| │   ├── src/
86| │   │   ├── app.ts
87| │   │   ├── server.ts
88| │   │
89| │   │   ├── config/
90| │   │   │   ├── env.ts
91| │   │   │   ├── database.ts
92| │   │   │   └── providers.ts
93| │   │
94| │   │   ├── routes/
95| │   │   │   └── index.ts
96| │   │
97| │   │   ├── middleware/
98| │   │   │   ├── error-handler.ts
99| │   │   │   ├── not-found.ts
100| │   │   │   └── request-validation.ts
101| │   │
102| │   │   ├── common/
103| │   │   │   ├── errors/
104| │   │   │   ├── http/
105| │   │   │   ├── logging/
106| │   │   │   ├── validation/
107| │   │   │   └── types/
108| │   │
109| │   │   ├── modules/
110| │   │   │
111| │   │   │   ├── places/               # MEMBER 1
112| │   │   │   │   ├── places.routes.ts
113| │   │   │   │   ├── places.controller.ts
114| │   │   │   │   ├── places.service.ts
115| │   │   │   │   ├── places.repository.ts
116| │   │   │   │   ├── places.validation.ts
117| │   │   │   │   ├── providers/
118| │   │   │   │   │   └── osm.provider.ts
119| │   │   │   │   └── tests/
120| │   │   │
121| │   │   │   ├── assistant/            # MEMBER 2
122| │   │   ���   │   ├── assistant.routes.ts
123| │   │   │   │   ├── assistant.controller.ts
124| │   │   │   │   ├── assistant.service.ts
125| │   │   │   │   ├── intent/
126| │   │   │   │   ├── rag/
127| │   │   │   │   ├── embeddings/
128| │   │   │   │   ├── providers/
129| │   │   │   │   │   └── gemini.provider.ts
130| │   │   │   │   ├── assistant.validation.ts
131| │   │   │   │   └── tests/
132| │   │   │
133| │   │   │   ├── travel-services/      # MEMBER 3
134| │   │   │   │   ├── travel-services.routes.ts
135| │   │   │   │   ├── weather/
136| │   │   │   │   │   ├── weather.controller.ts
137| │   │   │   │   │   ├── weather.service.ts
138| │   │   │   │   │   └── weatherapi.provider.ts
139| │   │   │   │   ├── routing/
140| │   │   │   │   │   ├── routing.controller.ts
141| │   │   │   │   │   ├── routing.service.ts
142| │   │   │   │   │   └── addis-transit.provider.ts
143| │   │   │   │   ├── speech/
144| │   │   │   │   │   ├── speech.controller.ts
145| │   │   │   │   │   ├── speech.service.ts
146| │   │   │   │   │   └── addis-ai.provider.ts
147| │   │   │   │   └── tests/
148| │   │   │
149| │   │   │   └── incidents/            # MEMBER 4
150| │   │   │       ├── incidents.routes.ts
151| │   │   │       ├── incidents.controller.ts
152| │   │   │       ├── incidents.service.ts
153| │   │   │       ├── incidents.repository.ts
154| │   │   │       ├── incidents.validation.ts
155| │   │   │       ├── moderation/
156| │   │   │       ├── notifications/
157| │   │   │       └── tests/
158| │   │
159| │   │   └── tests/
160| │   │       ├── integration/
161| │   │       └── fixtures/
162| │   │
163| │   └── database/
164| │       ├── migrations/
165| │       ├── seeds/
166| │       ├── extensions.sql
167| │       └── README.md
168| |
169| ├── ai-ml/                            # MEMBER 2
170| │   ├── src/
170| │   │   ├── rag/
170| │   │   │   ├── pipeline/
170| │   │   │   ├── retrieval/
170| │   │   │   ├── ranking/
170| │   │   │   ├── prompts/
170| │   │   │   └── guards/
170| │   │   ├── embeddings/
170| │   │   │   ├── models/
170| │   │   │   └── loaders/
170| │   │   ├── datasets/
170| │   │   ├── eval/
170| │   │   ├── notebooks/
170| │   │   └── tests/
170| │   ├── requirements.txt
170| │   ├── pyproject.toml
170| │   └── README.md
170| │
171| ├── shared/
172| │   └── contracts/
173| │       └── src/
174| │           ├── places.ts
175| │           ├── assistant.ts
176| │           ├── travel-services.ts
177| │           ├── incidents.ts
178| │           └── index.ts
179| │
180| ├── scripts/
181| │   ├── dev-check.sh
182| │   └── seed-dev-data.ts
183| │
184| └── .github/
185|     └── workflows/
186|         └── ci.yml
187| 
188| 
189| This is the recommended structure, not a requirement to create every file immediately. Create files as features are implemented. Choose one database migration strategy, such as Prisma migrations or SQL migrations, instead of maintaining two competing systems.
190| 
191| 3. Member 1 — OpenStreetMap and Nearby Services
192| Backend: Places module
193| Main folders owned:
194| backend/src/modules/places/
195| backend/src/modules/places/tests/
196| database/migrations/    # Place-related migrations
197| 
198| 
199| Responsibilities
200| 1. Integrate OpenStreetMap through providers/osm.provider.ts.
201| 2. Retrieve and normalize location and place data.
202| 3. Support nearby services such as:
203|    - Hospitals and clinics
204|    - Pharmacies
205|    - Hotels
206|    - Restaurants
207|    - Fuel stations
208|    - Other agreed service categories
209| 4. Design the places database schema.
210| 5. Store and query geographic coordinates using PostGIS.
211| 6. Implement nearby-place search by distance and category.
212| 7. Implement place details and search APIs.
213| 8. Write tests for place searching and spatial queries.
214| Expected deliverables
215| - OSM integration module.
216| - Places database schema and migrations.
217| - PostGIS nearby-search functionality.
218| - Place-search and place-detail APIs.
219| - Tests and API documentation.
220| Important: Member 1 provides reliable place data to Member 2's AI assistant and Member 5's frontend.
221| 4. Member 2 — Multilingual AI Assistant and RAG
222| Backend: Assistant module
223| Main folders owned:
224| ai-ml/src/
225| ai-ml/src/rag/
226| ai-ml/tests/
227| 
228| 
229| Responsibilities
230| 1. Integrate Gemini through providers/gemini.provider.ts.
231| 2. Support English, Amharic, and Afaan Oromo, validated through testing.
232| 3. Identify the user's language and intent.
233| 4. Implement the assistant query workflow.
234| 5. Implement RAG (Retrieval-Augmented Generation).
235| 6. Use pgvector for semantic retrieval of suitable reference content.
236| 7. Obtain relevant place, weather, route, and incident information through the other modules' agreed interfaces.
237| 8. Ground responses in retrieved information and avoid inventing live facts.
238| 9. Include sources where available and communicate uncertainty.
239| 10. Test multilingual prompts, retrieval, and provider failures.
240| Expected deliverables
241| - Gemini integration.
242| - Language and intent handling.
243| - RAG and embedding/retrieval components.
244| - Assistant API.
245| - Multilingual and failure-handling tests.
246| Main dependency
247| Member 2 depends on Members 1, 3, and 4 for live service data. To avoid blocking development, use mock responses until those modules are ready.
248| 5. Member 3 — Weather, Routing, and Speech
249| Backend: Travel services module
250| Main folders owned:
251| backend/src/modules/travel-services/
252| backend/src/modules/travel-services/tests/
253| 
254| 
255| Responsibilities
256| Weather
257| - Integrate WeatherAPI.
258| - Retrieve current weather and forecast data.
259| - Provide weather advice based on the user's expected arrival time when suitable forecast data is available.
260| - Cache responses when appropriate.
261| Routing
262| - Investigate and verify Addis Transit API capabilities.
263| - Implement the routing provider adapter.
264| - Normalize route information for the frontend and AI assistant.
265| - Handle unavailable or incomplete route data.
266| Speech
267| - Verify Addis AI's supported speech operations and languages.
268| - Implement supported speech-to-text and/or text-to-speech features.
269| - Return clear errors for unsupported languages or unavailable services.
270| Reliability
271| - Handle API timeouts, rate limits, and provider errors.
272| - Keep provider-specific logic inside the appropriate adapter.
273| - Document endpoint request and response structures.
274| Expected deliverables
275| - Weather and forecast APIs.
276| - Arrival-weather advice API.
277| - Routing API, if the provider supports the required functionality.
278| - Supported speech APIs.
279| - Tests and provider setup documentation.
280| 
281| 6. Member 4 — Road Incidents and Notifications
282| Backend: Incidents module
283| Main folders owned:
284| backend/src/modules/incidents/
285| backend/src/modules/incidents/tests/
286| database/migrations/    # Incident and notification migrations
287| 
288| 
289| Responsibilities
290| 1. Design the road incident database schema.
291| 2. Implement incident submission with type, description, location, and timestamp.
292| 3. Support incident categories such as:
293|    - Accidents
294|    - Road closures
295|    - Flooding
296|    - Construction
297|    - Road damage
298| 4. Implement nearby-incident searches using PostGIS.
299| 5. Implement incident detail and status endpoints.
300| 6. Add duplicate-report handling and report-expiry rules.
301| 7. Implement moderation and verification status.
302| 8. Implement notification preferences and background notification jobs using an agreed notification provider.
303| 9. Provide incident data for the map and AI assistant.
304| 10. Test validation, spatial searches, moderation, and notification behavior.
305| Expected deliverables
306| - Incident submission and search APIs.
307| - Incident database schema.
308| - Moderation and verification logic.
309| - Notification and expiry services.
310| - Tests and API documentation.
311| Safety requirement: New community reports should be marked unverified until reviewed or corroborated. The interface should show report age and verification status.
312| 
313| 7. Member 5 — Frontend and User Experience
314| Frontend: React application
315| Main folder owned:
316| frontend/
317| 
318| 
319| Responsibilities
320| 1. Build the React + TypeScript application structure.
321| 2. Implement the main application layout and navigation.
322| 3. Build the map interface and nearby-service results.
323| 4. Display routes and weather information.
324| 5. Build the multilingual AI chat interface.
325| 6. Build incident reporting forms and incident map/list views.
326| 7. Implement saved locations and user preferences.
327| 8. Add English, Amharic, and Afaan Oromo interface translations.
328| 9. Add speech controls when the backend supports them.
329| 10. Use Motion for appropriate transitions and respect reduced-motion settings.
330| 11. Connect to backend endpoints through a typed API client.
331| 12. Handle loading, error, empty, and offline states.
332| 13. Write component and end-to-end tests.
333| Expected deliverables
334| - Working React frontend.
335| - Map and service-discovery interface.
336| - AI assistant interface.
337| - Route, weather, and incident screens.
338| - Multilingual interface.
339| - Backend API integration and frontend tests.
340| Important: Member 5 owns the frontend, not all system integration. Every backend member must provide working, tested endpoints and help connect their feature.
341| 
342| 8. Shared folders and responsibilities
343| Some folders cannot belong exclusively to one member because changes affect the whole system.
344| Folder	Responsibility
345| docs/	All members maintain documentation for their features.
346| backend/src/config/	Shared backend configuration; changes must be coordinated.
347| backend/src/common/	Shared error handling, logging, validation, and utilities.
348| backend/src/routes/index.ts	Backend integration owner mounts routes exported by each module.
349| shared/contracts/	Team-agreed API request and response types.
350| database/migrations/	Each member prepares migrations for their feature; the team reviews conflicts.
351| .env.example	All members document required environment variable names. Never put real secrets here.
352| .github/workflows/	A team-agreed maintainer configures automated checks and tests.
353| 
354| How shared work should be handled
355| - Discuss shared changes before modifying them.
356| - Each feature owner proposes API and database changes for their module.
357| - Agree on API contracts before implementing features that depend on each other.
358| - Use code reviews before merging changes into the main branch.
359| 
360| 9. Proposed API ownership
361| These are internal GuzoMate endpoints, not the external providers' own API URLs.
362| Member	Example endpoints
363| Member 1 — Places	GET /api/v1/places/nearby, GET /api/v1/places/:id
364| Member 2 — AI	POST /api/v1/assistant/query
365| Member 3 — Travel services	GET /api/v1/weather, GET /api/v1/weather/arrival, POST /api/v1/routes
366| Member 3 — Speech	POST /api/v1/speech/transcribe, POST /api/v1/speech/synthesize, only if supported
367| Member 4 — Incidents	POST /api/v1/incidents, GET /api/v1/incidents/nearby, GET /api/v1/incidents/:id
368| Member 5 — Frontend	Consumes the endpoints above through the API client.
369| 
370| The exact request and response formats should be agreed upon and documented in docs/API_REFERENCE.md before implementation.
371| 
372| 10. How the team should work together
373| Step 1 — Agree on API contracts
374| Before backend development starts in parallel, agree on what each endpoint receives and returns. Put shared TypeScript types in shared/contracts/ if you decide to use a shared package.
375| Step 2 — Use separate Git branches
376| For example:
377| main
378| ├── feature/places
379| ├── feature/assistant
380| ├── feature/travel-services
381| ├── feature/incidents
382| └── feature/frontend
383| 
384| 
385| Each member commits to their feature branch and opens a pull request for review.
386| Step 3 — Keep feature code separated
387| - Member 1 changes modules/places/.
388| - Member 2 changes modules/assistant/.
| 389| - Member 3 changes modules/travel-services/.
390| - Member 4 changes modules/incidents/.
391| - Member 5 changes frontend/.
392| Coordinate first when a task needs changes in another member's module.
393| Step 4 — Use mock data where needed
394| Member 5 can develop the frontend with mock API responses while the backend modules are being implemented. Member 2 can also use mock place, weather, route, and incident services while waiting for real integrations.
395| Step 5 — Test before merging
396| Each member should provide:
397| - Unit tests for their own logic.
398| - Integration tests for API and database behavior where applicable.
399| - Example API requests and responses.
400| - Required environment variable names.
401| - Setup instructions.
402| Run formatting, linting, TypeScript checks, and tests before merging.
403| 
404| 11. Definition of done for each member
405| A feature is ready for integration when:
406| - Its code is in the agreed folders.
407| - It follows the documented API contracts.
408| - It validates inputs and handles expected errors.
409| - It has relevant tests.
410| - It does not contain committed API keys or secrets.
411| - Its setup requirements are documented.
412| - It can be run and reviewed by another team member.
413| 12. Important technical notes
414| - OSM: Follow applicable attribution and Open Database License requirements. Choose an access method suitable for your expected traffic.
415| - PostGIS: Use for geographic searches and distance calculations.
416| - pgvector: Use for semantic retrieval; it does not replace routing calculations or live weather data.
417| - External providers: Verify authentication, quotas, licensing, availability, and language support before depending on a feature.
418| - Security: Validate user input, rate-limit public endpoints, protect moderation actions, and never expose provider secrets to the frontend.
419| - Incident reliability: Display report age and verification status so unverified reports are not mistaken for confirmed facts.
420| 