# GuzoMate — Travelers Assistance 🌍

GuzoMate is an intelligent, multilingual travel assistance application tailored for travelers and commuters in Addis Ababa and beyond. It combines **OpenStreetMap (OSM)** geospatial discovery, **PostGIS** spatial queries, and **AI-powered semantic search** using **LangChain + BAAI/bge-m3** with **pgvector**.

Supported languages: **English**, **Amharic (አማርኛ)**, and **Afaan Oromo**.

---

## 🏛️ System Architecture

The project is structured as a monorepo consisting of three primary components:

1. **`frontend/`**: Interactive UI built with React, TypeScript, and Motion.
2. **`backend/`**: REST API built with Node.js, Express, and TypeScript.
3. **`ai-ml/`**: Multilingual RAG pipeline, embeddings, and semantic search.

---

## ☁️ Cloud Database (Supabase PostgreSQL + PostGIS + pgvector)

All **13,861 points of interest (POIs)** across Addis Ababa have been extracted, categorized, and embedded with full 1,024-dimensional multilingual vector representations (**BAAI/bge-m3**) and are hosted live on **Supabase**.

### Unified Table: `addis_geo_points`

| Column | Type | Description |
|:---|:---|:---|
| `id` | `SERIAL PRIMARY KEY` | Unique location identifier |
| `latitude` | `DOUBLE PRECISION` | Latitude coordinate (e.g. `9.036`) |
| `longtiude` | `DOUBLE PRECISION` | Longitude coordinate (e.g. `38.752`) |
| `other_tags` | `TEXT` | Raw OpenStreetMap tags |
| `content` | `TEXT` | Formatted multilingual text (Name, Amharic name, English name, type, amenities) |
| `embedding` | `DOUBLE PRECISION[]` | **1,024-dimensional BGE-M3 Multilingual Vector** |

---

## 👥 Contributor Guide: Connecting to the Database

Other contributors do **not** need to install Docker or re-run heavy machine-learning scripts locally. You can read and write directly to the cloud database.

### 1. Configure Your Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Your `.env` will contain the preconfigured Supabase connection pooler URL:
   ```env
   DATABASE_URL=postgresql://postgres.jdbdgcrmmtbkelkmsiug:Eyosi%231234%40Eyosi@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
   ```

### 2. Verify Your Connection

Run the connection test script:
```bash
python backend/scripts/test_supabase_connection.py
```
If successful, you will see the total count (`13,861 places available`) and sample records.

### 3. Connect via Desktop GUI Tools (pgAdmin / DBeaver)

To view tables and run SQL queries from your local machine:
- **Host / Address:** `aws-0-eu-west-1.pooler.supabase.com`
- **Port:** `6543`
- **Maintenance Database:** `postgres`
- **Username:** `postgres.jdbdgcrmmtbkelkmsiug`
- **Password:** `Eyosi#1234@Eyosi`
- **SSL Mode:** `Require`

---

## 🔍 Multilingual Hybrid Search (Semantic + PostGIS Distance)

You can query the dataset semantically in any supported language:

```bash
# In Amharic:
python backend/scripts/hybrid_search_test.py "ባህላዊ የቡና ቦታ"

# In Afaan Oromo:
python backend/scripts/hybrid_search_test.py "Bakka nyaataa fi bunaa"

# In English:
python backend/scripts/hybrid_search_test.py "Hospitals and emergency clinics near me"
```

The search algorithm:
1. Embeds the user query in real time using `BAAI/bge-m3`.
2. Computes **cosine similarity** against the stored vector embeddings in `addis_geo_points`.
3. Concurrently uses **PostGIS (`ST_Distance`)** to calculate real physical distances in meters from the user's GPS coordinates.

---

## 👥 Module Ownership & Responsibilities

| Role | Member | Responsibilities | Key Folders |
|:---|:---:|:---|:---|
| **Member 1** | Places & OSM | OpenStreetMap places, PostGIS spatial queries, category filtering | `backend/src/modules/places/` |
| **Member 2** | AI Assistant & RAG | Multilingual intent, Gemini grounding, BGE-M3 semantic retrieval | `ai-ml/`, `backend/src/modules/assistant/` |
| **Member 3** | Travel Services | WeatherAPI, Addis Transit routing adapter, speech controls | `backend/src/modules/travel-services/` |
| **Member 4** | Road Incidents | Road incident reporting, verification workflows, notifications | `backend/src/modules/incidents/` |
| **Member 5** | Frontend & UX | React + TypeScript + Motion UI, responsive map, chat interface | `frontend/` |

---

## 🚀 Local Development Setup

### Backend
```bash
cd backend
npm install
npm run dev
```
The server will start at `http://localhost:8000`. Test the health check endpoint:
```text
http://localhost:8000/api/v1/health
```

### Docker (Optional Local Database)
If you prefer running a local PostGIS container instead of Supabase:
```bash
cd backend
docker compose up -d
```
pgAdmin will be available locally at `http://localhost:5050`.
