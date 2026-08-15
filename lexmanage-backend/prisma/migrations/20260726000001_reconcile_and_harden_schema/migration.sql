-- Reconcile databases previously managed with `prisma db push` or the incomplete
-- historical migrations. Existing notification rows are transformed, not dropped.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'isActive'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE "tenants" RENAME COLUMN "isActive" TO "is_active";
  END IF;
END $$;

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "address" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "fax" TEXT,
  ADD COLUMN IF NOT EXISTS "website" TEXT,
  ADD COLUMN IF NOT EXISTS "siret" TEXT,
  ADD COLUMN IF NOT EXISTS "bar_number" TEXT,
  ADD COLUMN IF NOT EXISTS "logo_url" TEXT,
  ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "client_id" TEXT;

ALTER TABLE "documents"
  ADD COLUMN IF NOT EXISTS "sub_category" TEXT,
  ADD COLUMN IF NOT EXISTS "allowed_roles" "Role"[] NOT NULL DEFAULT ARRAY[]::"Role"[],
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "qdrant_id" TEXT;

ALTER TABLE "deadlines" ALTER COLUMN "case_id" DROP NOT NULL;
ALTER TABLE "deadlines"
  ALTER COLUMN "due_at" TYPE DATE USING "due_at"::date;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "barreau" TEXT,
  ADD COLUMN IF NOT EXISTS "specialty" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_refresh_token_key"
  ON "users"("refresh_token");

ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "request_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "chat_messages_conversation_id_request_id_role_key"
  ON "chat_messages"("conversation_id", "request_id", "role");

DO $$ BEGIN
  CREATE TYPE "NotificationSource" AS ENUM ('USER', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- The first migration created a legacy per-user notifications table. Rename it
-- only when its old shape is detected, then migrate it into the current model.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'level'
  ) THEN
    ALTER TABLE "notifications" RENAME TO "notifications_legacy_20260726";
    ALTER TABLE "notifications_legacy_20260726"
      RENAME CONSTRAINT "notifications_pkey" TO "notifications_legacy_20260726_pkey";
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "level" "NotificationLevel" NOT NULL,
  "motif" "NotificationMotif" NOT NULL,
  "title" TEXT,
  "message" VARCHAR(500),
  "source" "NotificationSource" NOT NULL DEFAULT 'USER',
  "created_by_id" TEXT,
  "recipient_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "read_by_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "case_id" TEXT,
  "idempotency_key" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "source" "NotificationSource" NOT NULL DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS "created_by_id" TEXT,
  ADD COLUMN IF NOT EXISTS "recipient_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "read_by_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "case_id" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;

DO $$
BEGIN
  IF to_regclass('public.notifications_legacy_20260726') IS NOT NULL THEN
    INSERT INTO "notifications" (
      "id", "tenant_id", "level", "motif", "title", "message", "source",
      "created_by_id", "recipient_ids", "read_by_ids", "created_at"
    )
    SELECT
      n."id",
      n."tenant_id",
      CASE
        WHEN upper(n."priority") = 'URGENT' THEN 'URGENT'::"NotificationLevel"
        WHEN upper(n."priority") IN ('HIGH', 'IMPORTANT') THEN 'IMPORTANT'::"NotificationLevel"
        ELSE 'NORMAL'::"NotificationLevel"
      END,
      'OTHER'::"NotificationMotif",
      n."title",
      left(n."message", 500),
      'USER'::"NotificationSource",
      n."user_id",
      ARRAY[n."user_id"],
      CASE WHEN n."is_read" THEN ARRAY[n."user_id"] ELSE ARRAY[]::TEXT[] END,
      n."created_at"
    FROM "notifications_legacy_20260726" n
    ON CONFLICT ("id") DO NOTHING;

    DROP TABLE "notifications_legacy_20260726";
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_hash_key"
  ON "password_reset_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_tenant_id_user_id_idx"
  ON "password_reset_tokens"("tenant_id", "user_id");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_at_idx"
  ON "password_reset_tokens"("expires_at");

-- Fail safely if pre-existing rows violate tenant ownership. These rows must be
-- reviewed instead of being silently attached to another firm.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "cases" c JOIN "clients" p ON p.id = c.client_id
    WHERE c.client_id IS NOT NULL AND c.tenant_id <> p.tenant_id
  ) OR EXISTS (
    SELECT 1 FROM "cases" c JOIN "users" u ON u.id = c.assignee_id
    WHERE c.assignee_id IS NOT NULL AND c.tenant_id <> u.tenant_id
  ) OR EXISTS (
    SELECT 1 FROM "documents" d JOIN "users" u ON u.id = d.uploader_id
    WHERE d.tenant_id <> u.tenant_id
  ) OR EXISTS (
    SELECT 1 FROM "documents" d JOIN "cases" c ON c.id = d.case_id
    WHERE d.case_id IS NOT NULL AND d.tenant_id <> c.tenant_id
  ) OR EXISTS (
    SELECT 1 FROM "deadlines" d JOIN "cases" c ON c.id = d.case_id
    WHERE d.case_id IS NOT NULL AND d.tenant_id <> c.tenant_id
  ) OR EXISTS (
    SELECT 1 FROM "notifications" n JOIN "users" u ON u.id = n.created_by_id
    WHERE n.created_by_id IS NOT NULL AND n.tenant_id <> u.tenant_id
  ) OR EXISTS (
    SELECT 1 FROM "notifications" n JOIN "cases" c ON c.id = n.case_id
    WHERE n.case_id IS NOT NULL AND n.tenant_id <> c.tenant_id
  ) OR EXISTS (
    SELECT 1 FROM "notification_templates" n JOIN "users" u ON u.id = n.created_by_id
    WHERE n.tenant_id <> u.tenant_id
  ) OR EXISTS (
    SELECT 1 FROM "scheduled_notifications" n JOIN "users" u ON u.id = n.created_by_id
    WHERE n.tenant_id <> u.tenant_id
  ) OR EXISTS (
    SELECT 1 FROM "scheduled_notifications" n JOIN "cases" c ON c.id = n.case_id
    WHERE n.case_id IS NOT NULL AND n.tenant_id <> c.tenant_id
  ) OR EXISTS (
    SELECT 1 FROM "audit_logs" a JOIN "users" u ON u.id = a.user_id
    WHERE a.tenant_id <> u.tenant_id
  ) OR EXISTS (
    SELECT 1 FROM "chat_conversations" c JOIN "users" u ON u.id = c.user_id
    WHERE c.tenant_id <> u.tenant_id
  ) THEN
    RAISE EXCEPTION 'Cross-tenant relations detected. Correct the rows before deploying this migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "users_id_tenant_id_key"
  ON "users"("id", "tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "clients_id_tenant_id_key"
  ON "clients"("id", "tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "cases_id_tenant_id_key"
  ON "cases"("id", "tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "documents_id_tenant_id_key"
  ON "documents"("id", "tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "chat_conversations_id_tenant_id_key"
  ON "chat_conversations"("id", "tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_tenant_id_idempotency_key_key"
  ON "notifications"("tenant_id", "idempotency_key");

CREATE INDEX IF NOT EXISTS "cases_tenant_id_created_at_id_idx"
  ON "cases"("tenant_id", "created_at", "id");
CREATE INDEX IF NOT EXISTS "cases_tenant_id_status_idx"
  ON "cases"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "cases_tenant_id_assignee_id_idx"
  ON "cases"("tenant_id", "assignee_id");
CREATE INDEX IF NOT EXISTS "cases_tenant_id_client_id_idx"
  ON "cases"("tenant_id", "client_id");
CREATE INDEX IF NOT EXISTS "clients_tenant_id_created_at_id_idx"
  ON "clients"("tenant_id", "created_at", "id");
CREATE INDEX IF NOT EXISTS "documents_tenant_id_created_at_id_idx"
  ON "documents"("tenant_id", "created_at", "id");
CREATE INDEX IF NOT EXISTS "documents_tenant_id_case_id_idx"
  ON "documents"("tenant_id", "case_id");
CREATE INDEX IF NOT EXISTS "notifications_tenant_id_level_idx"
  ON "notifications"("tenant_id", "level");
CREATE INDEX IF NOT EXISTS "notifications_tenant_id_created_at_idx"
  ON "notifications"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "notifications_recipient_ids_idx"
  ON "notifications" USING GIN ("recipient_ids");
CREATE INDEX IF NOT EXISTS "notifications_read_by_ids_idx"
  ON "notifications" USING GIN ("read_by_ids");
CREATE INDEX IF NOT EXISTS "deadlines_tenant_id_due_at_is_done_idx"
  ON "deadlines"("tenant_id", "due_at", "is_done");
CREATE INDEX IF NOT EXISTS "deadlines_tenant_id_case_id_idx"
  ON "deadlines"("tenant_id", "case_id");
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_id_created_at_id_idx"
  ON "audit_logs"("tenant_id", "created_at", "id");
CREATE INDEX IF NOT EXISTS "chat_conversations_tenant_id_updated_at_id_idx"
  ON "chat_conversations"("tenant_id", "updated_at", "id");
CREATE INDEX IF NOT EXISTS "scheduled_notifications_tenant_id_scheduled_at_status_idx"
  ON "scheduled_notifications"("tenant_id", "scheduled_at", "status");

ALTER TABLE "cases"
  DROP CONSTRAINT IF EXISTS "cases_client_id_fkey",
  DROP CONSTRAINT IF EXISTS "cases_assignee_id_fkey";
ALTER TABLE "cases"
  ADD CONSTRAINT "cases_client_id_tenant_id_fkey"
    FOREIGN KEY ("client_id", "tenant_id") REFERENCES "clients"("id", "tenant_id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "cases_assignee_id_tenant_id_fkey"
    FOREIGN KEY ("assignee_id", "tenant_id") REFERENCES "users"("id", "tenant_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "documents"
  DROP CONSTRAINT IF EXISTS "documents_case_id_fkey",
  DROP CONSTRAINT IF EXISTS "documents_uploader_id_fkey";
ALTER TABLE "documents"
  ADD CONSTRAINT "documents_case_id_tenant_id_fkey"
    FOREIGN KEY ("case_id", "tenant_id") REFERENCES "cases"("id", "tenant_id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "documents_uploader_id_tenant_id_fkey"
    FOREIGN KEY ("uploader_id", "tenant_id") REFERENCES "users"("id", "tenant_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "deadlines" DROP CONSTRAINT IF EXISTS "deadlines_case_id_fkey";
ALTER TABLE "deadlines"
  ADD CONSTRAINT "deadlines_case_id_tenant_id_fkey"
    FOREIGN KEY ("case_id", "tenant_id") REFERENCES "cases"("id", "tenant_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
  DROP CONSTRAINT IF EXISTS "notifications_tenant_id_fkey",
  DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey",
  DROP CONSTRAINT IF EXISTS "notifications_created_by_id_fkey",
  DROP CONSTRAINT IF EXISTS "notifications_case_id_fkey";
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "notifications_created_by_id_tenant_id_fkey"
    FOREIGN KEY ("created_by_id", "tenant_id") REFERENCES "users"("id", "tenant_id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "notifications_case_id_tenant_id_fkey"
    FOREIGN KEY ("case_id", "tenant_id") REFERENCES "cases"("id", "tenant_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notification_templates"
  DROP CONSTRAINT IF EXISTS "notification_templates_created_by_id_fkey";
ALTER TABLE "notification_templates"
  ADD CONSTRAINT "notification_templates_created_by_id_tenant_id_fkey"
    FOREIGN KEY ("created_by_id", "tenant_id") REFERENCES "users"("id", "tenant_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "scheduled_notifications"
  DROP CONSTRAINT IF EXISTS "scheduled_notifications_created_by_id_fkey",
  DROP CONSTRAINT IF EXISTS "scheduled_notifications_case_id_fkey";
ALTER TABLE "scheduled_notifications"
  ADD CONSTRAINT "scheduled_notifications_created_by_id_tenant_id_fkey"
    FOREIGN KEY ("created_by_id", "tenant_id") REFERENCES "users"("id", "tenant_id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "scheduled_notifications_case_id_tenant_id_fkey"
    FOREIGN KEY ("case_id", "tenant_id") REFERENCES "cases"("id", "tenant_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "password_reset_tokens"
  DROP CONSTRAINT IF EXISTS "password_reset_tokens_tenant_id_fkey",
  DROP CONSTRAINT IF EXISTS "password_reset_tokens_user_id_fkey";
ALTER TABLE "password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "password_reset_tokens_user_id_tenant_id_fkey"
    FOREIGN KEY ("user_id", "tenant_id") REFERENCES "users"("id", "tenant_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_user_id_fkey";
ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_user_id_tenant_id_fkey"
    FOREIGN KEY ("user_id", "tenant_id") REFERENCES "users"("id", "tenant_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chat_conversations"
  DROP CONSTRAINT IF EXISTS "chat_conversations_user_id_fkey";
ALTER TABLE "chat_conversations"
  ADD CONSTRAINT "chat_conversations_user_id_tenant_id_fkey"
    FOREIGN KEY ("user_id", "tenant_id") REFERENCES "users"("id", "tenant_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
