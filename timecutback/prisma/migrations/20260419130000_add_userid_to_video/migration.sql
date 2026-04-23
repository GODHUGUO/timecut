-- Add user ownership to videos
ALTER TABLE "Video" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Backfill existing rows before enforcing NOT NULL
UPDATE "Video"
SET "userId" = 'legacy_user'
WHERE "userId" IS NULL;

ALTER TABLE "Video" ALTER COLUMN "userId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Video_userId_createdAt_idx"
ON "Video"("userId", "createdAt");