import assert from "node:assert/strict";
import test from "node:test";

import type { AssertionRunSummary } from "../src/lib/assertions/types";
import {
  HISTORY_PAGE_SIZE,
  MAX_HISTORY_RUNS_PER_ENDPOINT,
  MAX_HISTORY_RUNS_PER_USER,
  MAX_PERSISTED_RESPONSE_BODY_BYTES,
} from "../src/lib/history/constants";
import { requestRunOwnedByUserWhere } from "../src/lib/history/ownership";
import {
  decodeHistoryCursor,
  encodeHistoryCursor,
  historyCursorWhere,
} from "../src/lib/history/pagination";
import { formatLocalTimestamp } from "../src/lib/history/timestamp";
import { persistHistorySafely } from "../src/lib/history/persistence-status";
import {
  boundedResponseBody,
  buildSavedRunSnapshot,
  sanitizeHistoryUrl,
} from "../src/lib/history/snapshots";
import type { ExecutionFailure, ExecutionSuccess } from "../src/lib/request-executor/types";
import { executionRequestSchema } from "../src/lib/validation/execution";

const success: ExecutionSuccess = {
  ok: true,
  response: {
    status: 200,
    statusText: "OK",
    durationMs: 42,
    sizeBytes: 128,
    headers: [{ key: "content-type", value: "application/json" }],
    body: '{"ok":true}',
    bodyKind: "json",
    contentType: "application/json",
    finalUrl: "https://public.example/users?token=do-not-store",
    redirectCount: 0,
  },
};

const assertions: AssertionRunSummary = {
  total: 1,
  passed: 0,
  failed: 1,
  results: [{
    index: 0,
    assertionId: "client-supplied-id-is-not-linked",
    type: "STATUS_CODE",
    operator: "EQUALS",
    target: null,
    expected: "201",
    actual: "200",
    passed: false,
    label: "Status code equals 201",
    message: "Expected status code = 201; received 200.",
  }],
};

test("saved-run snapshots capture response and assertion results without secret URL values", () => {
  const snapshot = buildSavedRunSnapshot(
    {
      endpointId: "endpoint-a",
      endpointName: "List users",
      userId: "user-a",
      method: "GET",
      url: "https://public.example/users?api_key=secret#fragment",
    },
    success,
    assertions,
  );

  assert.equal(snapshot.url, "https://public.example/users");
  assert.equal("finalUrl" in snapshot ? snapshot.finalUrl : null, "https://public.example/users");
  assert.equal(snapshot.executionStatus, "SUCCESS");
  assert.equal(snapshot.assertionResults.create.length, 1);
  assert.deepEqual(snapshot.assertionResults.create[0], {
    type: "STATUS_CODE",
    operator: "EQUALS",
    target: null,
    label: "Status code equals 201",
    position: 0,
    passed: false,
    expected: "201",
    actual: "200",
    message: "Expected status code = 201; received 200.",
  });

  assertions.results[0].label = "Edited later";
  assert.equal(snapshot.assertionResults.create[0].label, "Status code equals 201");
});

test("infrastructure failures create bounded historical failure records", () => {
  const failure: ExecutionFailure = {
    ok: false,
    error: { code: "TIMEOUT", message: "The target did not respond in time." },
  };
  const snapshot = buildSavedRunSnapshot(
    {
      endpointId: "endpoint-a",
      endpointName: "Slow API",
      userId: "user-a",
      method: "GET",
      url: "https://slow.example/path",
    },
    failure,
    null,
  );
  assert.equal(snapshot.executionStatus, "TIMEOUT");
  assert.equal(snapshot.errorCode, "TIMEOUT");
  assert.deepEqual(snapshot.assertionResults.create, []);
});

test("history body snapshots enforce a UTF-8 byte limit and omit binary bytes", () => {
  const body = `${"a".repeat(MAX_PERSISTED_RESPONSE_BODY_BYTES - 1)}🙂tail`;
  const bounded = boundedResponseBody(body, "text");
  assert.equal(bounded.truncated, true);
  assert.ok(bounded.value);
  assert.ok(Buffer.byteLength(bounded.value, "utf8") <= MAX_PERSISTED_RESPONSE_BODY_BYTES);
  assert.equal(bounded.value.includes("�"), false);
  assert.deepEqual(boundedResponseBody("not retained", "binary"), {
    value: null,
    truncated: false,
  });
});

test("history URLs retain the public target identity without query values or fragments", () => {
  assert.equal(
    sanitizeHistoryUrl("https://api.example/path?q=public&token=secret#section"),
    "https://api.example/path",
  );
  assert.equal(sanitizeHistoryUrl("not a URL"), "Invalid URL");
});

test("cursor pagination is opaque, stable, and safely rejects malformed input", () => {
  const cursor = { createdAt: new Date("2026-10-01T10:00:00.000Z"), id: "run-a" };
  const encoded = encodeHistoryCursor(cursor);
  assert.deepEqual(decodeHistoryCursor(encoded), cursor);
  assert.deepEqual(historyCursorWhere(cursor), {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: "run-a" } },
    ],
  });
  assert.equal(decodeHistoryCursor("malformed"), null);
  assert.equal(decodeHistoryCursor("x".repeat(513)), null);
});

test("history timestamps format in the runtime-selected timezone without a timezone suffix", () => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
  const formatted = formatLocalTimestamp("2026-10-02T06:16:00.000Z", formatter);

  assert.match(formatted, /Oct 2, 2026/);
  assert.match(formatted, /11:46/);
  assert.doesNotMatch(formatted, /UTC|GMT|IST/);
});

test("history uses centralized conservative page and retention bounds", () => {
  assert.equal(HISTORY_PAGE_SIZE, 20);
  assert.equal(MAX_HISTORY_RUNS_PER_ENDPOINT, 100);
  assert.equal(MAX_HISTORY_RUNS_PER_USER, 500);
  assert.ok(HISTORY_PAGE_SIZE < MAX_HISTORY_RUNS_PER_ENDPOINT);
});

test("history ownership always includes the authenticated server user", () => {
  assert.deepEqual(requestRunOwnedByUserWhere("user-a", "run-a"), {
    id: "run-a",
    userId: "user-a",
  });
  assert.notDeepEqual(
    requestRunOwnedByUserWhere("user-a", "run-a"),
    requestRunOwnedByUserWhere("user-b", "run-a"),
  );
  assert.throws(() => requestRunOwnedByUserWhere("", "run-a"));
});

test("execution accepts an optional endpoint reference but still rejects client user IDs", () => {
  const request = {
    endpointId: "endpoint-a",
    method: "GET",
    url: "https://public.example/users",
    queryParameters: [],
    headers: [],
    body: null,
    assertions: [],
  };
  assert.equal(executionRequestSchema.safeParse(request).success, true);
  assert.equal(executionRequestSchema.safeParse({ ...request, userId: "user-b" }).success, false);
});

test("history persistence failures return a safe status instead of hiding execution results", async () => {
  const status = await persistHistorySafely(async () => {
    throw new Error("database details must not be exposed");
  });
  assert.deepEqual(status, {
    persisted: false,
    message: "The execution result is available, but this run could not be saved to history.",
  });
  assert.equal("database details must not be exposed" in status, false);
});

