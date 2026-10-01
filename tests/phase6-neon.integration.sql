BEGIN;

INSERT INTO "User" ("id", "updatedAt")
VALUES ('phase6-neon-user-a', CURRENT_TIMESTAMP), ('phase6-neon-user-b', CURRENT_TIMESTAMP);

INSERT INTO "Collection" ("id", "userId", "name", "updatedAt")
VALUES ('phase6-neon-collection-a', 'phase6-neon-user-a', 'Phase 6 integration', CURRENT_TIMESTAMP);

INSERT INTO "Endpoint" ("id", "collectionId", "name", "method", "url", "updatedAt")
VALUES (
  'phase6-neon-endpoint-a',
  'phase6-neon-collection-a',
  'Historical endpoint name',
  'GET',
  'https://api.example.com/users',
  CURRENT_TIMESTAMP
);

INSERT INTO "Assertion" (
  "id", "endpointId", "type", "operator", "expectedValue", "position", "updatedAt"
)
VALUES (
  'phase6-neon-assertion-a',
  'phase6-neon-endpoint-a',
  'STATUS_CODE',
  'EQUALS',
  '200',
  0,
  CURRENT_TIMESTAMP
);

INSERT INTO "RequestRun" (
  "id", "endpointId", "userId", "endpointName", "method", "url", "finalUrl",
  "statusCode", "statusText", "durationMs", "responseSizeBytes",
  "responseContentType", "responseBodyKind", "responseBody", "executionStatus", "createdAt"
)
VALUES
  (
    'phase6-neon-run-old', 'phase6-neon-endpoint-a', 'phase6-neon-user-a',
    'Historical endpoint name', 'GET', 'https://api.example.com/users',
    'https://api.example.com/users', 200, 'OK', 40, 11,
    'application/json', 'json', '{"ok":true}', 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '1 minute'
  ),
  (
    'phase6-neon-run-new', 'phase6-neon-endpoint-a', 'phase6-neon-user-a',
    'Historical endpoint name', 'GET', 'https://api.example.com/users',
    'https://api.example.com/users', 503, 'Service Unavailable', 55, 19,
    'application/json', 'json', '{"available":false}', 'HTTP_RESPONSE', CURRENT_TIMESTAMP
  );

INSERT INTO "AssertionResult" (
  "id", "requestRunId", "assertionId", "type", "operator", "label", "position",
  "passed", "expected", "actual", "message"
)
VALUES (
  'phase6-neon-result-a', 'phase6-neon-run-old', 'phase6-neon-assertion-a',
  'STATUS_CODE', 'EQUALS', 'Status code equals 200', 0, true, '200', '200', 'Assertion passed.'
);

DO $$
DECLARE
  owner_count INTEGER;
  foreign_owner_count INTEGER;
  newest_id TEXT;
BEGIN
  SELECT COUNT(*) INTO owner_count
  FROM "RequestRun"
  WHERE "userId" = 'phase6-neon-user-a';

  SELECT COUNT(*) INTO foreign_owner_count
  FROM "RequestRun"
  WHERE "userId" = 'phase6-neon-user-b';

  SELECT "id" INTO newest_id
  FROM "RequestRun"
  WHERE "userId" = 'phase6-neon-user-a'
  ORDER BY "createdAt" DESC, "id" DESC
  LIMIT 1;

  IF owner_count <> 2 OR foreign_owner_count <> 0 OR newest_id <> 'phase6-neon-run-new' THEN
    RAISE EXCEPTION 'Phase 6 owner isolation or newest-first ordering verification failed.';
  END IF;
END $$;

UPDATE "Endpoint"
SET "name" = 'Current endpoint name', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'phase6-neon-endpoint-a';

UPDATE "Assertion"
SET "expectedValue" = '201', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'phase6-neon-assertion-a';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "RequestRun" r
    JOIN "AssertionResult" ar ON ar."requestRunId" = r."id"
    WHERE r."id" = 'phase6-neon-run-old'
      AND r."endpointName" = 'Historical endpoint name'
      AND ar."label" = 'Status code equals 200'
      AND ar."expected" = '200'
  ) THEN
    RAISE EXCEPTION 'Phase 6 historical snapshot changed after editing live resources.';
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO "RequestRun" (
      "id", "endpointId", "userId", "endpointName", "method", "url", "executionStatus"
    ) VALUES (
      'phase6-neon-partial-run', 'phase6-neon-endpoint-a', 'phase6-neon-user-a',
      'Must roll back', 'GET', 'https://api.example.com/users', 'SUCCESS'
    );

    INSERT INTO "AssertionResult" (
      "id", "requestRunId", "assertionId", "type", "passed"
    ) VALUES (
      'phase6-neon-invalid-result', 'phase6-neon-partial-run',
      'missing-assertion', 'STATUS_CODE', true
    );
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  IF EXISTS (SELECT 1 FROM "RequestRun" WHERE "id" = 'phase6-neon-partial-run') THEN
    RAISE EXCEPTION 'Phase 6 transaction allowed a partial request run.';
  END IF;
END $$;

INSERT INTO "Endpoint" ("id", "collectionId", "name", "method", "url", "updatedAt")
VALUES (
  'phase6-neon-retention-endpoint',
  'phase6-neon-collection-a',
  'Retention verification',
  'GET',
  'https://api.example.com/retention',
  CURRENT_TIMESTAMP
);

INSERT INTO "RequestRun" (
  "id", "endpointId", "userId", "endpointName", "method", "url", "executionStatus", "createdAt"
)
SELECT
  'phase6-neon-retention-' || LPAD(series::TEXT, 3, '0'),
  'phase6-neon-retention-endpoint',
  'phase6-neon-user-a',
  'Retention verification',
  'GET',
  'https://api.example.com/retention',
  'SUCCESS',
  CURRENT_TIMESTAMP + (series * INTERVAL '1 second')
FROM GENERATE_SERIES(1, 101) AS series;

WITH retained AS (
  SELECT "id"
  FROM "RequestRun"
  WHERE "userId" = 'phase6-neon-user-a'
    AND "endpointId" = 'phase6-neon-retention-endpoint'
  ORDER BY "createdAt" DESC, "id" DESC
  LIMIT 100
)
DELETE FROM "RequestRun"
WHERE "userId" = 'phase6-neon-user-a'
  AND "endpointId" = 'phase6-neon-retention-endpoint'
  AND "id" NOT IN (SELECT "id" FROM retained);

DO $$
DECLARE
  retained_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO retained_count
  FROM "RequestRun"
  WHERE "endpointId" = 'phase6-neon-retention-endpoint';

  IF retained_count <> 100
    OR EXISTS (SELECT 1 FROM "RequestRun" WHERE "id" = 'phase6-neon-retention-001')
    OR NOT EXISTS (SELECT 1 FROM "RequestRun" WHERE "id" = 'phase6-neon-retention-101')
  THEN
    RAISE EXCEPTION 'Phase 6 conservative retention verification failed.';
  END IF;
END $$;

DELETE FROM "Endpoint" WHERE "id" = 'phase6-neon-endpoint-a';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "RequestRun" r
    JOIN "AssertionResult" ar ON ar."requestRunId" = r."id"
    WHERE r."id" = 'phase6-neon-run-old'
      AND r."endpointId" IS NULL
      AND r."endpointName" = 'Historical endpoint name'
      AND ar."assertionId" IS NULL
      AND ar."label" = 'Status code equals 200'
  ) THEN
    RAISE EXCEPTION 'Phase 6 history did not survive live endpoint deletion safely.';
  END IF;
END $$;

ROLLBACK;

