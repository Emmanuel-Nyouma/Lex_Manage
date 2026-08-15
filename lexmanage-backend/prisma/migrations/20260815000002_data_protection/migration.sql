ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "search_tokens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "search_tokens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "search_tokens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "cases_search_tokens_idx" ON "cases" USING GIN ("search_tokens");
CREATE INDEX IF NOT EXISTS "clients_search_tokens_idx" ON "clients" USING GIN ("search_tokens");
CREATE INDEX IF NOT EXISTS "documents_search_tokens_idx" ON "documents" USING GIN ("search_tokens");
