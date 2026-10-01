BEGIN;

INSERT INTO "User" ("id", "name", "createdAt", "updatedAt")
VALUES ('phase7-test-user', 'Phase 7 Test', NOW(), NOW());

INSERT INTO "Collection" ("id", "userId", "name", "createdAt", "updatedAt")
VALUES ('phase7-test-collection', 'phase7-test-user', 'Phase 7 Test', NOW(), NOW());

INSERT INTO "Endpoint" ("id", "collectionId", "name", "method", "url", "createdAt", "updatedAt")
VALUES ('phase7-test-endpoint', 'phase7-test-collection', 'Encrypted header test', 'GET', 'https://example.com', NOW(), NOW());

INSERT INTO "RequestHeader" (
  "id", "endpointId", "key", "value", "valueKind", "enabled", "sensitive", "createdAt", "updatedAt"
)
VALUES (
  'phase7-test-header', 'phase7-test-endpoint', 'Authorization', 'v1.synthetic.ciphertext.payload',
  'ENCRYPTED', TRUE, TRUE, NOW(), NOW()
);

DELETE FROM "Endpoint" WHERE "id" = 'phase7-test-endpoint';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "RequestHeader" WHERE "id" = 'phase7-test-header') THEN
    RAISE EXCEPTION 'PHASE7_CASCADE_CHECK_FAILED';
  END IF;
END $$;

ROLLBACK;
