-- ============================================================================
-- Migration: 20261031020000_independent_auth_mechanisms
-- Description: Add full_name and auth_provider columns to users table
-- ============================================================================

-- 1. Add full_name and auth_provider columns to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_provider" VARCHAR(32) NOT NULL DEFAULT 'local';

-- 2. Populate full_name from existing name if present
UPDATE "users" SET "full_name" = "name" WHERE "full_name" IS NULL AND "name" IS NOT NULL;
UPDATE "users" SET "auth_provider" = 'google' WHERE "google_id" IS NOT NULL;
