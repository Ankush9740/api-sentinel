BEGIN;

INSERT INTO "User" ("id", "updatedAt")
VALUES ('phase5-neon-user-a', CURRENT_TIMESTAMP), ('phase5-neon-user-b', CURRENT_TIMESTAMP);

INSERT INTO "Collection" ("id", "userId", "name", "updatedAt")
VALUES ('phase5-neon-collection-a', 'phase5-neon-user-a', 'Phase 5 integration', CURRENT_TIMESTAMP);

INSERT INTO "Endpoint" ("id", "collectionId", "name", "method", "url", "updatedAt")
VALUES (
  'phase5-neon-endpoint-a',
  'phase5-neon-collection-a',
  'Assertion persistence',
  'GET',
  'https://api.example.com/users/42',
  CURRENT_TIMESTAMP
);

INSERT INTO "Assertion" (
  "id", "endpointId", "type", "operator", "target", "expectedValue", "position", "updatedAt"
)
VALUES
  ('phase5-neon-assertion-0', 'phase5-neon-endpoint-a', 'STATUS_CODE', 'EQUALS', NULL, '200', 0, CURRENT_TIMESTAMP),
  ('phase5-neon-assertion-1', 'phase5-neon-endpoint-a', 'RESPONSE_TIME', 'LESS_THAN', NULL, '500', 1, CURRENT_TIMESTAMP),
  ('phase5-neon-assertion-2', 'phase5-neon-endpoint-a', 'HEADER', 'CONTAINS', 'content-type', 'json', 2, CURRENT_TIMESTAMP),
  ('phase5-neon-assertion-3', 'phase5-neon-endpoint-a', 'JSON_PATH', 'EQUALS', 'user.id', '42', 3, CURRENT_TIMESTAMP);

DO $$
DECLARE
  owner_count INTEGER;
  foreign_owner_count INTEGER;
  positions INTEGER[];
BEGIN
  SELECT COUNT(*), ARRAY_AGG(a."position" ORDER BY a."position")
  INTO owner_count, positions
  FROM "Assertion" a
  JOIN "Endpoint" e ON e."id" = a."endpointId"
  JOIN "Collection" c ON c."id" = e."collectionId"
  WHERE c."userId" = 'phase5-neon-user-a';

  IF owner_count <> 4 OR positions <> ARRAY[0, 1, 2, 3] THEN
    RAISE EXCEPTION 'Phase 5 assertion persistence or ordering verification failed.';
  END IF;

  SELECT COUNT(*) INTO foreign_owner_count
  FROM "Assertion" a
  JOIN "Endpoint" e ON e."id" = a."endpointId"
  JOIN "Collection" c ON c."id" = e."collectionId"
  WHERE c."userId" = 'phase5-neon-user-b';

  IF foreign_owner_count <> 0 THEN
    RAISE EXCEPTION 'Phase 5 ownership isolation verification failed.';
  END IF;
END $$;

UPDATE "Assertion"
SET "operator" = 'BETWEEN', "expectedValue" = '200,299', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'phase5-neon-assertion-0';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "Assertion"
    WHERE "id" = 'phase5-neon-assertion-0'
      AND "operator" = 'BETWEEN'
      AND "expectedValue" = '200,299'
  ) THEN
    RAISE EXCEPTION 'Phase 5 assertion update verification failed.';
  END IF;
END $$;

ROLLBACK;
