-- Retention cleanup scans by creation date across all tenants.
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"
  ON "audit_logs"("created_at");
