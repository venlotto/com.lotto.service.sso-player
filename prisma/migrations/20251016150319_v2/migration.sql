-- Step 1: Add columns as nullable
ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "created_by_ip" TEXT;
ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "created_by_user_agent" TEXT;
ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "family_id" UUID;
ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "replaced_by_token_id" UUID;
ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "revoked_at" TIMESTAMP(3);
ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "rotated_at" TIMESTAMP(3);
ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "token_id" UUID;

-- Step 2: Populate token_id and family_id with UUID values for existing rows
UPDATE "refresh_tokens" SET "token_id" = gen_random_uuid() WHERE "token_id" IS NULL;
UPDATE "refresh_tokens" SET "family_id" = gen_random_uuid() WHERE "family_id" IS NULL;

-- Step 3: Make token_id and family_id NOT NULL
ALTER TABLE "refresh_tokens" ALTER COLUMN "token_id" SET NOT NULL;
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET NOT NULL;

-- Step 4: Add default values for new rows
ALTER TABLE "refresh_tokens" ALTER COLUMN "token_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET DEFAULT gen_random_uuid();

-- Step 5: Create unique constraint and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_id_key" ON "refresh_tokens"("token_id");
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");
