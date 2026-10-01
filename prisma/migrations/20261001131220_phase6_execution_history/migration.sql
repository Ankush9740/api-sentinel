-- DropIndex
DROP INDEX "AssertionResult_requestRunId_idx";

-- AlterTable
ALTER TABLE "AssertionResult" ADD COLUMN     "label" TEXT,
ADD COLUMN     "operator" "AssertionOperator",
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "target" TEXT;

-- AlterTable
ALTER TABLE "RequestRun" ADD COLUMN     "endpointName" TEXT,
ADD COLUMN     "finalUrl" TEXT,
ADD COLUMN     "redirectCount" INTEGER,
ADD COLUMN     "responseBodyKind" TEXT,
ADD COLUMN     "responseBodyTruncated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "statusText" TEXT;

-- CreateIndex
CREATE INDEX "AssertionResult_requestRunId_position_idx" ON "AssertionResult"("requestRunId", "position");
