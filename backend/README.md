# GuzoMate Backend API 🚗🛡️

GuzoMate is a community-driven road incident reporting and road safety platform tailored for travelers and commuters in Addis Ababa and beyond. It enables users to report road accidents, blockages, flooding, heavy traffic, construction, and hazards in real time, discover nearby incidents with PostGIS geospatial queries, verify reports via community consensus, and receive targeted safety notifications.

---

## 🏛️ Architecture & Tech Stack

- **Runtime & Language**: Node.js (v20+) with TypeScript (strict mode)
- **Framework**: Express.js with modular layered architecture
- **Database**: PostgreSQL hosted on Supabase
- **Extensions**: **PostGIS** (`postgis`) for geospatial queries & **pgvector** (`vector`) for semantic embeddings
- **ORM**: Prisma ORM (`@prisma/client` 6.x) with native connection pooler optimization
- **Authentication**: JWT (Access Token) + bcryptjs password hashing
- **Validation**: Zod schema validation middleware
- **Logging**: Winston structured JSON logger
- **API Documentation**: OpenAPI 3.0 / Swagger UI mounted at `/api/v1/docs`
- **Testing**: Vitest + Supertest

---

## 📁 Repository Structure

```text
backend/
├── prisma/
│   ├── schema.prisma               # Canonical database schema
│   └── migrations/                 # Versioned SQL migrations (PostGIS + pgvector)
├── src/
│   ├── app.ts                      # Express application setup & middleware stack
│   ├── server.ts                   # Server entrypoint & background lifecycle worker
│   ├── config/
│   │   ├── env.ts                  # Zod-validated environment configuration
│   │   ├── database.ts             # Prisma Client singleton & connection management
│   │   └── logger.ts               # Winston structured logging
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT verification & req.user attachment
│   │   ├── role.middleware.ts      # Role-based access control (USER, MODERATOR, ADMIN)
│   │   ├── request-validation.ts   # Zod request body/query/params validator
│   │   ├── rate-limit.middleware.ts# General & auth-specific rate limiting
│   │   ├── not-found.middleware.ts # Standardized 404 handler
│   │   └── error-handler.ts        # Centralized error handler with AppError
│   ├── modules/
│   │   ├── auth/                   # Registration, login, JWT issuance, /auth/me
│   │   ├── users/                  # User profile & notification preferences
│   │   ├── incidents/              # Incident reporting, PostGIS nearby, duplicate check
│   │   ├── confirmations/          # Community verification & threshold activation
│   │   ├── moderation/             # Moderator review queue & audit logging
│   │   └── notifications/          # In-app alerts, device tokens, FCM/Mock delivery
│   ├── shared/
│   │   ├── errors/                 # AppError and ErrorCode definitions
│   │   ├── types/                  # Global types and Express request augmentations
│   │   ├── constants/              # System constants (thresholds, distance limits)
│   │   └── utils/                  # Standardized JSON response envelope helpers
│   ├── docs/
│   │   └── swagger.ts              # OpenAPI 3.0 specification
│   └── routes/
│       └── index.ts                # Master API v1 route aggregator
├── tests/
│   ├── auth.test.ts                # Auth flow tests (7 tests)
│   ├── users.test.ts               # User profile & preferences tests (5 tests)
│   ├── incidents.test.ts           # PostGIS nearby & duplicate detection tests (7 tests)
│   ├── confirmations.test.ts       # Voting & automatic activation tests (5 tests)
│   ├── moderation.test.ts          # Moderator review & audit trail tests (5 tests)
│   └── notifications.test.ts       # In-app & push token tests (4 tests)
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `backend/` directory (or use `.env.example` as a template):

```env
PORT=8000
NODE_ENV=development

# Database URLs (Supabase PostgreSQL with PostGIS & pgvector)
# DATABASE_URL connects via port 6543 (Transaction Mode Pooler for runtime Prisma)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# DIRECT_URL connects via port 5432 (Session Mode for Prisma migrations)
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

# JWT Secret & Expiry
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long"
JWT_EXPIRES_IN="7d"

# Client CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Push Notifications (Optional: set FCM_PROJECT_ID to enable Firebase, defaults to Mock provider)
FCM_PROJECT_ID=""
FCM_CLIENT_EMAIL=""
FCM_PRIVATE_KEY=""
```

---

## 🗄️ Database Migrations

Apply existing migrations to PostgreSQL:

```bash
npm run prisma:deploy
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

Open Prisma Studio:

```bash
npm run db:studio
```

---

## 🚀 Running the Application

### Development Mode (with hot-reload)
```bash
npm run dev
```

### Typecheck & Production Build
```bash
npm run typecheck
npm run build
npm start
```

### Interactive API Documentation (Swagger)
Once the server is running, navigate to:
```text
http://localhost:8000/api/v1/docs
```

---

## 🛣️ API Endpoints Summary

All API responses follow a consistent envelope structure:
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

### 1. Health & Places (Preserved Existing Endpoints)
- `GET /api/v1/health` — System health and database connectivity check
- `GET /api/v1/places` — OpenStreetMap places with category and spatial filtering

### 2. Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` — Register a new account (`email`, `password`, `fullName`, `preferredLanguage`)
- `POST /api/v1/auth/login` — Login with email and password (returns JWT `accessToken` & user profile)
- `GET /api/v1/auth/me` — Retrieve current authenticated user profile (`Bearer <token>`)

### 3. Users (`/api/v1/users`)
- `GET /api/v1/users/me` — Get authenticated user details
- `PUT /api/v1/users/me` — Update name or preferred language (`en`, `am`, `om`)
- `GET /api/v1/users/me/preferences` — Get notification preferences
- `PUT /api/v1/users/me/preferences` — Update notification preferences (`pushEnabled`, `incidentAlerts`, `radiusKm`)
- `GET /api/v1/users` — Admin-only paginated listing of system users

### 4. Incidents (`/api/v1/incidents`)
- `POST /api/v1/incidents` — Report an incident (`type`, `description`, `severity`, `lat`, `lon`, `mediaUrls`)
  - Automatically checks for duplicates (<500m & within 2h of existing incident with same type)
  - Automatically dispatches nearby notifications to users within configured radius
- `GET /api/v1/incidents` — Filter incidents by `status`, `type`, `severity` with pagination
- `GET /api/v1/incidents/nearby` — PostGIS spatial query:
  - Query parameters: `lat`, `lon`, `radiusKm` (default: 5km)
  - Uses `ST_DWithin` with geography casts and returns exact `distanceMeters` computed via `ST_Distance`
- `GET /api/v1/incidents/:id` — Get detailed incident record including confirmation counts
- `PUT /api/v1/incidents/:id` — Edit pending report (reporter only)
- `DELETE /api/v1/incidents/:id` — Delete report (reporter or moderator/admin)

### 5. Community Confirmations (`/api/v1/confirmations`)
- `POST /api/v1/confirmations` — Vote on an incident (`incidentId`, `action`: `CONFIRM` | `DISPUTE`, `comment`)
  - Prevents reporter from voting on their own report
  - Allows changing vote (upsert confirmation state)
  - **Automatic Activation**: When confirmations reach threshold ($\ge 3$ and confirmations > disputes), the incident automatically transitions from `PENDING` to `ACTIVE`
- `GET /api/v1/confirmations/incident/:incidentId` — List community votes and dispute breakdown

### 6. Moderation (`/api/v1/moderation`)
- `GET /api/v1/moderation/queue` — Moderator review queue for pending/disputed reports (`MODERATOR` or `ADMIN`)
- `POST /api/v1/moderation/status` — Transition incident status (`status`: `ACTIVE`, `RESOLVED`, `REJECTED`, `ARCHIVED`, `reason`)
- `GET /api/v1/moderation/history/:incidentId` — Full audit trail of status changes with moderator IDs and notes

### 7. Notifications (`/api/v1/notifications`)
- `GET /api/v1/notifications` — List user's in-app notifications with `unreadCount`
- `PUT /api/v1/notifications/:id/read` — Mark notification as read
- `PUT /api/v1/notifications/read-all` — Mark all user notifications as read
- `POST /api/v1/notifications/devices` — Register FCM / APNS device token for push delivery
- `DELETE /api/v1/notifications/devices/:token` — Deactivate device push token

---

## 🧪 Automated Testing

The backend includes a comprehensive Vitest test suite covering 100% of the API surface.

Run the complete test suite:
```bash
npm test
```

### Test Suite Results:
- `tests/auth.test.ts` (7 tests) — Registration, duplicate handling, login, invalid credentials, JWT parsing
- `tests/users.test.ts` (5 tests) — Profile retrieval, updates, notification preferences, RBAC guards
- `tests/incidents.test.ts` (7 tests) — Report creation, duplicate detection (<500m), PostGIS spatial radius queries, coordinate validation, authorization guards
- `tests/confirmations.test.ts` (5 tests) — Self-vote prevention, confirmation voting, vote toggling to dispute, automatic transition to `ACTIVE` at threshold
- `tests/moderation.test.ts` (5 tests) — RBAC restrictions, review queue, rejection validation, status transition with audit logging, audit trail history
- `tests/notifications.test.ts` (4 tests) — Device token registration, in-app notifications listing, batch read status update, token deactivation

**Total: 33/33 tests passing.**
