-- Enable UUID helpers for defaults used by Prisma schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE "refresh_tokens"
  ADD COLUMN IF NOT EXISTS "token_id" UUID,
  ADD COLUMN IF NOT EXISTS "family_id" UUID,
  ADD COLUMN IF NOT EXISTS "created_by_ip" TEXT,
  ADD COLUMN IF NOT EXISTS "created_by_user_agent" TEXT,
  ADD COLUMN IF NOT EXISTS "rotated_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "replaced_by_token_id" UUID,
  ADD COLUMN IF NOT EXISTS "revoked_at" TIMESTAMPTZ;

UPDATE "refresh_tokens"
SET
  "token_id" = COALESCE("token_id", uuid_generate_v4()),
  "family_id" = COALESCE("family_id", uuid_generate_v4());

ALTER TABLE "refresh_tokens"
  ALTER COLUMN "token_id" SET NOT NULL,
  ALTER COLUMN "family_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refresh_tokens_token_id_key'
  ) THEN
    ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_token_id_key" UNIQUE ("token_id");
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "refresh_tokens_family_id_idx" ON "refresh_tokens" ("family_id");
