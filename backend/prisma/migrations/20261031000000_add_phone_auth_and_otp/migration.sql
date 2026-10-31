-- ============================================================================
-- Migration: 20261031000000_add_phone_auth_and_otp
-- Description: Add phone_number and is_phone_verified to users, create otp_verifications table
-- ============================================================================

-- 1. Update Users Table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" VARCHAR(32);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_phone_verified" BOOLEAN NOT NULL DEFAULT false;

-- 2. Create Unique Index on phone_number
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_number_key" ON "users"("phone_number");

-- 3. Create OtpVerifications Table
CREATE TABLE IF NOT EXISTS "otp_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone_number" VARCHAR(32) NOT NULL,
    "otp_hash" VARCHAR(255) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "resend_available_at" TIMESTAMPTZ(6) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- 4. Create Indexes on otp_verifications
CREATE INDEX IF NOT EXISTS "otp_verifications_phone_number_idx" ON "otp_verifications"("phone_number");
CREATE INDEX IF NOT EXISTS "otp_verifications_phone_number_is_used_idx" ON "otp_verifications"("phone_number", "is_used");
