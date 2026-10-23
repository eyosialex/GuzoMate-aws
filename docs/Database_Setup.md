# GuzoMate — Database Layer Documentation

## 1. Overview

The GuzoMate database layer is built using:
- **PostgreSQL 15+** (tested with PostGIS 17-3.5)
- **Prisma ORM 6.19.3**
- **PostGIS extension** (for geodesic distance, radius searches, and spatial indexing)
- **pgvector extension** (for 1024-dimension BGE-M3 multilingual RAG semantic embeddings)
- **"uuid-ossp" / pgcrypto** (for UUID primary keys)

The database models are designed to support the modular GuzoMate backend: places, road incidents, user preferences, AI/RAG knowledge, and weather cache.

---

## 2. PostgreSQL Extensions and Permissions

GuzoMate uses three PostgreSQL extensions:

| Extension | Purpose | Required Permissions |
|---|---|---|
| `uuid-ossp` | UUID generation utilities | Superuser or database owner (pre-installed on Supabase/AWS RDS) |
| `postgis` | Spatial types (`geography(Point, 4326)`) and operations (`ST_DWithin`, `ST_Distance`) | Superuser or database owner |
| `vector` (`pgvector`) | Vector data type (`vector(1024)`) and HNSW cosine index (`<=>`) | Superuser or database owner |

To enable these extensions manually if not using migrations:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 3. Data Models

### Summary of Models

| Model | Table Name | Purpose | Primary Spatial / Vector Attributes |
|---|---|---|---|
| `User` | `users` | Accounts, roles, language preferences | None |
| `Place` | `places` | OSM places, categories, contact info, tags | `location geography(Point, 4326)` with GiST index, plus `latitude`, `longitude` |
| `SavedPlace` | `saved_places` | Bookmarked places per user | None (FK to User & Place) |
| `Incident` | `incidents` | Road incidents (accidents, closures, etc.) | `location geography(Point, 4326)` with GiST index, plus `latitude`, `longitude` |
| `IncidentConfirmation` | `incident_confirmations` | Corroborating community signals for incidents | None (FK to Incident & User) |
| `NotificationSubscription`| `notification_subscriptions` | User alert radius and incident type subscriptions | None |
| `WeatherCache` | `weather_cache` | Cached weather forecasts per coordinate | `latitude`, `longitude`, `cache_key` |
| `RagDocument` | `rag_documents` | Curated travel documents & chunks for RAG | `embedding vector(1024)` with HNSW cosine index |
| `AuditLog` | `audit_logs` | Moderator actions and incident status audits | None |

### Spatial Auto-Synchronization Triggers
Both `places` and `incidents` have an automated PostgreSQL trigger (`sync_place_location_coords` and `sync_incident_location_coords`):
- When an insert/update provides PostGIS `location`, `latitude` and `longitude` numeric fields are automatically populated using `ST_Y(location::geometry)` and `ST_X(location::geometry)`.
- When an insert/update provides numeric `latitude` and `longitude`, PostGIS `location` is automatically constructed using `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`.
- This ensures full interoperability between standard Prisma Client queries and PostGIS raw SQL spatial queries.

---

## 4. Prisma Client Initialization

The Prisma Client singleton is defined in `backend/src/config/database.ts`:
- Exports `prisma` as a singleton instance to prevent connection leaks during development hot-reloads.
- Preserves the legacy `pool` export (`pg.Pool`) to ensure existing raw queries in `app.ts` continue to function without modifying application files.
- Reads `DATABASE_URL` from the environment.

### Database Query Helpers

Low-level database access helpers are located in `backend/src/config/db-helpers.ts`:
- `sqlPostgisPoint(lon, lat)`: Generates `ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography`
- `sqlDWithinMeters(col, lon, lat, radiusMeters)`: Generates `ST_DWithin` radius filtering
- `sqlDistanceMeters(col, lon, lat)`: Generates `ST_Distance` distance calculation in meters
- `sqlVectorCosineSimilarity(col, vector)`: Generates pgvector cosine similarity calculation
- `withTransaction(callback)`: Executes a transactional block via Prisma Client
- `checkDatabaseHealth()`: Validates connection and verifies presence of PostGIS and pgvector

---

## 5. Environment Variables

Configure the following variables in `.env`:

```dotenv
# Primary database connection string for Prisma and pg Pool
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME"

# Optional direct connection URL when using connection poolers (e.g., Supabase transaction pooler on port 6543)
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME"

# Embedding model dimension (BAAI/bge-m3 uses 1024)
EMBEDDING_MODEL="BAAI/bge-m3"
EMBEDDING_DIMENSION=1024
```

---

## 6. Migration and Seeding Commands

From the `backend/` directory:

```bash
# Generate Prisma Client
npm run prisma:generate

# Apply migrations in development
npm run prisma:migrate

# Apply migrations in production / CI
npm run prisma:deploy

# Run deterministic seed data
npm run prisma:seed

# Launch Prisma Studio GUI
npm run db:studio
```
