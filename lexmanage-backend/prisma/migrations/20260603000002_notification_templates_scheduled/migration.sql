-- CreateEnum
CREATE TYPE "NotificationLevel" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationMotif" AS ENUM ('HEARING', 'INTERNAL_MEETING', 'DEADLINE', 'DOCUMENT_TO_SIGN', 'NEW_CLIENT', 'INVOICE_PENDING', 'LEGAL_UPDATE', 'INTERNAL_REMINDER', 'CONFLICT_DETECTED', 'OTHER');

-- CreateTable: notification_templates
CREATE TABLE "notification_templates" (
  "id"             TEXT NOT NULL,
  "tenant_id"      TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "level"          "NotificationLevel" NOT NULL,
  "motif"          "NotificationMotif" NOT NULL,
  "title"          TEXT,
  "message"        VARCHAR(500),
  "recipient_roles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_by_id"  TEXT NOT NULL,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: scheduled_notifications
CREATE TABLE "scheduled_notifications" (
  "id"             TEXT NOT NULL,
  "tenant_id"      TEXT NOT NULL,
  "level"          "NotificationLevel" NOT NULL,
  "motif"          "NotificationMotif" NOT NULL,
  "title"          TEXT,
  "message"        VARCHAR(500),
  "recipient_roles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "scheduled_at"   TIMESTAMP(3) NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'PENDING',
  "job_id"         TEXT,
  "case_id"        TEXT,
  "created_by_id"  TEXT NOT NULL,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_templates_tenant_id_idx"       ON "notification_templates"("tenant_id");
CREATE INDEX "scheduled_notifications_tenant_id_idx"      ON "scheduled_notifications"("tenant_id");
CREATE INDEX "scheduled_notifications_scheduled_at_status_idx" ON "scheduled_notifications"("scheduled_at", "status");

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_case_id_fkey"
  FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
