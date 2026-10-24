-- ============================================================================
-- Migration: 20261024000000_add_notifications_devices_and_incident_counts
-- Description: Add notifications, device tokens, user status, and incident count columns
-- ============================================================================

-- 1. Create User Status Enum
DO $$ BEGIN
    CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add Enum Values if not existing
ALTER TYPE "incident_type" ADD VALUE IF NOT EXISTS 'ROAD_BLOCK';
ALTER TYPE "incident_type" ADD VALUE IF NOT EXISTS 'HAZARD';
ALTER TYPE "confirmation_type" ADD VALUE IF NOT EXISTS 'CONFIRM';
ALTER TYPE "confirmation_type" ADD VALUE IF NOT EXISTS 'DISPUTE';

-- 3. Update Users Table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" "user_status" NOT NULL DEFAULT 'ACTIVE';

-- 4. Update Incidents Table with Counters
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "confirmations_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "disputes_count" INTEGER NOT NULL DEFAULT 0;

-- 5. Update Incident Confirmations
ALTER TABLE "incident_confirmations" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 6. Create Notifications Table
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "incident_id" UUID,
    "type" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "delivery_status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "delivered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications"("is_read");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications"("created_at");

DO $$ BEGIN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 7. Create Device Tokens Table
CREATE TABLE IF NOT EXISTS "device_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "platform" VARCHAR(32) NOT NULL DEFAULT 'web',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "device_tokens_token_key" ON "device_tokens"("token");
CREATE INDEX IF NOT EXISTS "device_tokens_user_id_idx" ON "device_tokens"("user_id");

DO $$ BEGIN
    ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
