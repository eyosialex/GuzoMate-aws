-- ============================================================================
-- Migration: 20261023000000_init_guzomate_schema
-- Description: Initialize GuzoMate database schema with PostGIS and pgvector
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Enums
CREATE TYPE "user_role" AS ENUM ('USER', 'MODERATOR', 'ADMIN');
CREATE TYPE "language_code" AS ENUM ('en', 'am', 'om');
CREATE TYPE "incident_type" AS ENUM (
    'ACCIDENT',
    'ROAD_CLOSURE',
    'FLOODING',
    'LANDSLIDE',
    'ROAD_DAMAGE',
    'CONSTRUCTION',
    'HEAVY_TRAFFIC',
    'OTHER'
);
CREATE TYPE "incident_status" AS ENUM ('PENDING', 'ACTIVE', 'RESOLVED', 'REJECTED', 'EXPIRED');
CREATE TYPE "incident_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "verification_status" AS ENUM ('UNVERIFIED', 'COMMUNITY_CONFIRMED', 'MODERATOR_VERIFIED');
CREATE TYPE "confirmation_type" AS ENUM ('STILL_PRESENT', 'RESOLVED', 'INACCURATE');

-- 3. Create Tables

-- Users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255),
    "password_hash" VARCHAR(255),
    "preferred_language" "language_code" NOT NULL DEFAULT 'en',
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Places (OpenStreetMap places with PostGIS geography point)
CREATE TABLE "places" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "osm_type" VARCHAR(32),
    "osm_id" VARCHAR(64),
    "name" VARCHAR(255),
    "category" VARCHAR(64) NOT NULL,
    "tags" JSONB,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location" geography(Point, 4326),
    "source_updated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- Saved Places
CREATE TABLE "saved_places" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "place_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_places_pkey" PRIMARY KEY ("id")
);

-- Incidents
CREATE TABLE "incidents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reporter_id" UUID,
    "type" "incident_type" NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location" geography(Point, 4326),
    "status" "incident_status" NOT NULL DEFAULT 'PENDING',
    "severity" "incident_severity",
    "verification" "verification_status" NOT NULL DEFAULT 'UNVERIFIED',
    "occurred_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "evidence_url" VARCHAR(1024),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- Incident Confirmations
CREATE TABLE "incident_confirmations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "incident_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "confirmation_type" "confirmation_type" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_confirmations_pkey" PRIMARY KEY ("id")
);

-- Notification Subscriptions
CREATE TABLE "notification_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "radius_meters" INTEGER NOT NULL DEFAULT 5000,
    "incident_types" "incident_type"[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_subscriptions_pkey" PRIMARY KEY ("id")
);

-- Weather Cache
CREATE TABLE "weather_cache" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cache_key" VARCHAR(255) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "provider" VARCHAR(64) NOT NULL DEFAULT 'weatherapi',
    "forecast_json" JSONB NOT NULL,
    "retrieved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_cache_pkey" PRIMARY KEY ("id")
);

-- RAG Documents (with 1024-dimension BGE-M3 vector embedding)
CREATE TABLE "rag_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_type" VARCHAR(64) NOT NULL,
    "source_id" VARCHAR(255),
    "language" VARCHAR(10),
    "title" VARCHAR(255),
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "embedding" vector(1024),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

-- Audit Logs
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_user_id" UUID,
    "action" VARCHAR(128) NOT NULL,
    "target_type" VARCHAR(64) NOT NULL,
    "target_id" VARCHAR(255) NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- 4. Create Standard Indexes & Unique Constraints
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE INDEX "places_category_idx" ON "places"("category");
CREATE INDEX "places_name_idx" ON "places"("name");
CREATE UNIQUE INDEX "places_osm_type_osm_id_key" ON "places"("osm_type", "osm_id");

CREATE INDEX "saved_places_user_id_idx" ON "saved_places"("user_id");
CREATE INDEX "saved_places_place_id_idx" ON "saved_places"("place_id");
CREATE UNIQUE INDEX "saved_places_user_id_place_id_key" ON "saved_places"("user_id", "place_id");

CREATE INDEX "incidents_status_idx" ON "incidents"("status");
CREATE INDEX "incidents_type_idx" ON "incidents"("type");
CREATE INDEX "incidents_created_at_idx" ON "incidents"("created_at");
CREATE INDEX "incidents_expires_at_idx" ON "incidents"("expires_at");
CREATE INDEX "incidents_reporter_id_idx" ON "incidents"("reporter_id");

CREATE INDEX "incident_confirmations_incident_id_idx" ON "incident_confirmations"("incident_id");
CREATE INDEX "incident_confirmations_user_id_idx" ON "incident_confirmations"("user_id");
CREATE UNIQUE INDEX "incident_confirmations_incident_id_user_id_key" ON "incident_confirmations"("incident_id", "user_id");

CREATE INDEX "notification_subscriptions_user_id_idx" ON "notification_subscriptions"("user_id");

CREATE UNIQUE INDEX "weather_cache_cache_key_key" ON "weather_cache"("cache_key");
CREATE INDEX "weather_cache_cache_key_idx" ON "weather_cache"("cache_key");
CREATE INDEX "weather_cache_valid_until_idx" ON "weather_cache"("valid_until");

CREATE INDEX "rag_documents_source_type_source_id_idx" ON "rag_documents"("source_type", "source_id");
CREATE INDEX "rag_documents_language_idx" ON "rag_documents"("language");

CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- 5. Foreign Key Constraints
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "incident_confirmations" ADD CONSTRAINT "incident_confirmations_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incident_confirmations" ADD CONSTRAINT "incident_confirmations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_subscriptions" ADD CONSTRAINT "notification_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Spatial GiST Indexes (PostGIS)
CREATE INDEX IF NOT EXISTS "places_location_gist_idx" ON "places" USING GIST ("location");
CREATE INDEX IF NOT EXISTS "incidents_location_gist_idx" ON "incidents" USING GIST ("location");

-- 7. Vector Similarity Index (pgvector HNSW)
CREATE INDEX IF NOT EXISTS "rag_documents_embedding_hnsw_idx" ON "rag_documents" USING hnsw ("embedding" vector_cosine_ops);

-- 8. Spatial Auto-Synchronization Triggers
-- Keeps latitude/longitude numeric columns in sync with geography point and vice-versa
CREATE OR REPLACE FUNCTION sync_place_location_coords()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location IS NOT NULL AND (NEW.latitude IS NULL OR NEW.longitude IS NULL) THEN
    NEW.latitude := ST_Y(NEW.location::geometry);
    NEW.longitude := ST_X(NEW.location::geometry);
  ELSIF (NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL) AND NEW.location IS NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_place_location_coords ON "places";
CREATE TRIGGER trg_sync_place_location_coords
BEFORE INSERT OR UPDATE ON "places"
FOR EACH ROW EXECUTE FUNCTION sync_place_location_coords();

CREATE OR REPLACE FUNCTION sync_incident_location_coords()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location IS NOT NULL AND (NEW.latitude IS NULL OR NEW.longitude IS NULL) THEN
    NEW.latitude := ST_Y(NEW.location::geometry);
    NEW.longitude := ST_X(NEW.location::geometry);
  ELSIF (NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL) AND NEW.location IS NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_incident_location_coords ON "incidents";
CREATE TRIGGER trg_sync_incident_location_coords
BEFORE INSERT OR UPDATE ON "incidents"
FOR EACH ROW EXECUTE FUNCTION sync_incident_location_coords();
