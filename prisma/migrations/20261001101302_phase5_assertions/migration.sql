-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssertionOperator" ADD VALUE 'NOT_EQUALS';
ALTER TYPE "AssertionOperator" ADD VALUE 'DOES_NOT_EXIST';
ALTER TYPE "AssertionOperator" ADD VALUE 'CONTAINS';
ALTER TYPE "AssertionOperator" ADD VALUE 'GREATER_THAN';
ALTER TYPE "AssertionOperator" ADD VALUE 'BETWEEN';

-- DropIndex
DROP INDEX "Assertion_endpointId_idx";

-- AlterTable
ALTER TABLE "Assertion" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Assertion_endpointId_position_idx" ON "Assertion"("endpointId", "position");
