-- Revoke access tokens and WebSocket sessions immediately after security events.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "session_version" INTEGER NOT NULL DEFAULT 0;

-- Keep exactly one password-reset credential per user. If historical data contains
-- duplicates, retain the newest record before creating the unique constraint.
DELETE FROM "password_reset_tokens" older
USING "password_reset_tokens" newer
WHERE older."user_id" = newer."user_id"
  AND (older."created_at", older."id") < (newer."created_at", newer."id");

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_user_id_key"
  ON "password_reset_tokens"("user_id");
