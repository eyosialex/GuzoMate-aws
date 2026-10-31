-- ============================================================================
-- Migration: 20261031010000_add_google_oauth_fields
-- Description: Add google_id, avatar_url, and auth_providers columns to users table
-- ============================================================================

-- 1. Add columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_providers" TEXT[] NOT NULL DEFAULT ARRAY['local']::TEXT[];

-- 2. Create Unique Index on google_id
CREATE UNIQUE INDEX IF NOT EXISTS "users_google_id_key" ON "users"("google_id");
