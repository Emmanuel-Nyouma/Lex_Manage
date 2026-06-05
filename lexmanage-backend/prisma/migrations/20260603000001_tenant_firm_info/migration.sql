-- AlterTable: add firm info fields to tenants
ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "address"    TEXT,
  ADD COLUMN IF NOT EXISTS "phone"      TEXT,
  ADD COLUMN IF NOT EXISTS "fax"        TEXT,
  ADD COLUMN IF NOT EXISTS "website"    TEXT,
  ADD COLUMN IF NOT EXISTS "siret"      TEXT,
  ADD COLUMN IF NOT EXISTS "bar_number" TEXT,
  ADD COLUMN IF NOT EXISTS "logo_url"   TEXT;
