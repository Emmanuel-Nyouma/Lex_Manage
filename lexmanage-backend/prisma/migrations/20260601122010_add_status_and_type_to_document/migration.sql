-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'OCR_PENDING', 'OCR_DONE', 'INDEXED', 'ERROR');

-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED';
