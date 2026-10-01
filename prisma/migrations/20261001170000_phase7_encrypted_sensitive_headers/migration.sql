-- Existing rows were audited before this migration. The PLAIN default preserves
-- the representation of ordinary headers while making encrypted values explicit.
CREATE TYPE "RequestHeaderValueKind" AS ENUM ('PLAIN', 'ENCRYPTED');

ALTER TABLE "RequestHeader"
ADD COLUMN "valueKind" "RequestHeaderValueKind" NOT NULL DEFAULT 'PLAIN';
