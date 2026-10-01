import assert from "node:assert/strict";
import test from "node:test";

import { evaluateAssertions, resolveJsonPath } from "../src/lib/assertions/evaluator";
import type { AssertionDefinition } from "../src/lib/assertions/types";
import { assertionOwnedByUserWhere } from "../src/lib/collections/ownership";
import type { ExecutionSuccess } from "../src/lib/request-executor/types";
import { assertionsInputSchema } from "../src/lib/validation/assertions";
import { executionRequestSchema } from "../src/lib/validation/execution";
import { endpointInputSchema } from "../src/lib/validation/phase2";

const response: ExecutionSuccess["response"] = {
  status: 200,
  statusText: "OK",
  durationMs: 84,
  sizeBytes: 140,
  headers: [
    { key: "Content-Type", value: "application/json; charset=utf-8" },
    { key: "X-Request-Id", value: "request-123" },
  ],
  body: JSON.stringify({
    user: { id: 42, name: "Ada", active: true, middleName: null },
    items: [{ id: 7 }, { id: 9 }],
    tags: ["stable", "public"],
    numericText: "42",
  }),
  bodyKind: "json",
  contentType: "application/json; charset=utf-8",
  finalUrl: "https://public.example/users/42",
  redirectCount: 0,
};

test("assertion validation accepts supported rules and rejects invalid combinations", () => {
  const valid = [
    assertion({ type: "STATUS_CODE", operator: "BETWEEN", expectedValue: "200,299" }),
    assertion({ type: "RESPONSE_TIME", operator: "LESS_THAN", expectedValue: "500" }),
    assertion({ type: "HEADER", operator: "CONTAINS", target: "content-type", expectedValue: "json" }),
    assertion({ type: "JSON_PATH", operator: "EQUALS", target: "user.active", expectedValue: "true" }),
    assertion({ type: "JSON_PATH", operator: "EQUALS", target: "$.items[0].id", expectedValue: "7" }),
  ];
  assert.equal(assertionsInputSchema.safeParse(valid).success, true);

  assert.equal(assertionsInputSchema.safeParse([
    assertion({ type: "STATUS_CODE", operator: "CONTAINS", expectedValue: "200" }),
  ]).success, false);
  assert.equal(assertionsInputSchema.safeParse([
    assertion({ type: "HEADER", operator: "EXISTS", target: "Authorization", expectedValue: null }),
  ]).success, false);
  assert.equal(assertionsInputSchema.safeParse([
    assertion({ type: "JSON_PATH", operator: "EQUALS", target: "__proto__.polluted", expectedValue: "true" }),
  ]).success, false);
  assert.equal(assertionsInputSchema.safeParse([
    assertion({ type: "JSON_PATH", operator: "EQUALS", target: "$.items[*].id", expectedValue: "7" }),
  ]).success, false);
  assert.equal(assertionsInputSchema.safeParse([
    assertion({ type: "JSON_PATH", operator: "EQUALS", target: "user.id", expectedValue: "not-json" }),
  ]).success, false);
  assert.equal(assertionsInputSchema.safeParse(Array.from({ length: 51 }, () => assertion())).success, false);
});

test("saved and executable request validation rejects client ownership fields", () => {
  const endpoint = {
    name: "Users",
    collectionId: "collection-a",
    method: "GET",
    url: "https://public.example/users",
    body: "",
    queryParameters: [],
    headers: [],
    assertions: [assertion()],
  };
  assert.equal(endpointInputSchema.safeParse(endpoint).success, true);
  assert.equal(endpointInputSchema.safeParse({ ...endpoint, userId: "user-b" }).success, false);

  const execution = {
    method: "GET",
    url: "https://public.example/users",
    body: null,
    queryParameters: [],
    headers: [],
    assertions: [assertion()],
  };
  assert.equal(executionRequestSchema.safeParse(execution).success, true);
  assert.equal(executionRequestSchema.safeParse({ ...execution, userId: "user-b" }).success, false);
});

test("status and response-time assertions report clear pass and failure details", () => {
  const summary = evaluateAssertions(response, [
    assertion({ type: "STATUS_CODE", operator: "EQUALS", expectedValue: "200" }),
    assertion({ type: "STATUS_CODE", operator: "EQUALS", expectedValue: "201" }),
    assertion({ type: "STATUS_CODE", operator: "NOT_EQUALS", expectedValue: "204" }),
    assertion({ type: "STATUS_CODE", operator: "BETWEEN", expectedValue: "200,299" }),
    assertion({ type: "STATUS_CODE", operator: "BETWEEN", expectedValue: "400,499" }),
    assertion({ type: "RESPONSE_TIME", operator: "LESS_THAN", expectedValue: "100" }),
    assertion({ type: "RESPONSE_TIME", operator: "LESS_THAN", expectedValue: "50" }),
    assertion({ type: "RESPONSE_TIME", operator: "GREATER_THAN", expectedValue: "100" }),
    assertion({ type: "RESPONSE_TIME", operator: "BETWEEN", expectedValue: "50,90" }),
  ]);

  assert.deepEqual([summary.total, summary.passed, summary.failed], [9, 5, 4]);
  assert.match(summary.results[5].label, /100 ms/);
  assert.equal(summary.results[7].actual, "84 ms");
  assert.match(summary.results[7].message, /received 84 ms/);
});

test("response-header assertions use case-insensitive names and safe comparisons", () => {
  const summary = evaluateAssertions(response, [
    assertion({ type: "HEADER", operator: "EXISTS", target: "content-type", expectedValue: null }),
    assertion({ type: "HEADER", operator: "CONTAINS", target: "CONTENT-TYPE", expectedValue: "application/json" }),
    assertion({ type: "HEADER", operator: "EQUALS", target: "x-request-id", expectedValue: "request-123" }),
    assertion({ type: "HEADER", operator: "DOES_NOT_EXIST", target: "x-missing", expectedValue: null }),
    assertion({ type: "HEADER", operator: "NOT_EQUALS", target: "x-request-id", expectedValue: "wrong" }),
    assertion({ type: "HEADER", operator: "EXISTS", target: "x-missing", expectedValue: null }),
  ]);
  assert.deepEqual([summary.total, summary.passed, summary.failed], [6, 5, 1]);
});

test("JSON assertions traverse objects and arrays with strict scalar semantics", () => {
  const summary = evaluateAssertions(response, [
    assertion({ type: "JSON_PATH", operator: "EQUALS", target: "body.user.id", expectedValue: "42" }),
    assertion({ type: "JSON_PATH", operator: "EXISTS", target: "user.id", expectedValue: null }),
    assertion({ type: "JSON_PATH", operator: "EXISTS", target: "user.missing", expectedValue: null }),
    assertion({ type: "JSON_PATH", operator: "NOT_EQUALS", target: "user.id", expectedValue: '"42"' }),
    assertion({ type: "JSON_PATH", operator: "EQUALS", target: "user.active", expectedValue: "true" }),
    assertion({ type: "JSON_PATH", operator: "EQUALS", target: "user.middleName", expectedValue: "null" }),
    assertion({ type: "JSON_PATH", operator: "GREATER_THAN", target: "items.1.id", expectedValue: "8" }),
    assertion({ type: "JSON_PATH", operator: "LESS_THAN", target: "items.0.id", expectedValue: "8" }),
    assertion({ type: "JSON_PATH", operator: "CONTAINS", target: "tags", expectedValue: '"stable"' }),
    assertion({ type: "JSON_PATH", operator: "DOES_NOT_EXIST", target: "user.deletedAt", expectedValue: null }),
    assertion({ type: "JSON_PATH", operator: "EQUALS", target: "numericText", expectedValue: "42" }),
  ]);
  assert.deepEqual([summary.total, summary.passed, summary.failed], [11, 9, 2]);
  assert.equal(summary.results[10].actual, '"42"');
  assert.equal(resolveJsonPath(JSON.parse(response.body), "items.1.id").value, 9);
  assert.equal(resolveJsonPath(JSON.parse(response.body), "$.items[0].id").value, 7);
});

test("JSONPlaceholder root paths resolve after parsing the normalized JSON body", () => {
  const jsonPlaceholderResponse: ExecutionSuccess["response"] = {
    ...response,
    sizeBytes: 83,
    body: JSON.stringify({
      userId: 1,
      id: 1,
      title: "delectus aut autem",
      completed: false,
    }),
  };

  const summary = evaluateAssertions(jsonPlaceholderResponse, [
    assertion({ type: "STATUS_CODE", operator: "EQUALS", expectedValue: "200" }),
    assertion({ type: "JSON_PATH", operator: "EQUALS", target: "$.id", expectedValue: "1" }),
    assertion({ type: "JSON_PATH", operator: "EQUALS", target: "$.completed", expectedValue: "false" }),
    assertion({ type: "JSON_PATH", operator: "EXISTS", target: "$.missing", expectedValue: null }),
    assertion({ type: "JSON_PATH", operator: "DOES_NOT_EXIST", target: "$.missing", expectedValue: null }),
    assertion({ type: "JSON_PATH", operator: "EQUALS", target: "$.id", expectedValue: '"1"' }),
  ]);

  assert.deepEqual([summary.total, summary.passed, summary.failed], [6, 4, 2]);
  assert.equal(summary.results[0].passed, true);
  assert.equal(summary.results[1].passed, true);
  assert.equal(summary.results[1].actual, "1");
  assert.equal(summary.results[2].passed, true);
  assert.equal(summary.results[2].actual, "false");
  assert.equal(summary.results[3].passed, false);
  assert.match(summary.results[3].message, /\$\.missing was not found/);
  assert.equal(summary.results[4].passed, true);
  assert.equal(summary.results[5].passed, false);
  assert.match(summary.results[5].message, /received 1/);
});

test("JSON path parsing supports nested root properties and numeric array indexes safely", () => {
  const root = {
    user: { id: 3 },
    items: [{ id: 7 }],
  };

  assert.deepEqual(resolveJsonPath(root, "$.user.id"), { found: true, value: 3 });
  assert.deepEqual(resolveJsonPath(root, "$.items[0].id"), { found: true, value: 7 });
  assert.deepEqual(resolveJsonPath(root, "items.0.id"), { found: true, value: 7 });
  assert.deepEqual(resolveJsonPath(root, "body.items[0].id"), { found: true, value: 7 });
  assert.deepEqual(resolveJsonPath(root, "$.items[1].id"), { found: false, value: undefined });
  assert.deepEqual(resolveJsonPath(root, "$.__proto__.polluted"), { found: false, value: undefined });
});

test("non-JSON and malformed JSON responses fail JSON assertions without throwing", () => {
  for (const input of [
    { ...response, body: "plain text", bodyKind: "text" as const },
    { ...response, body: "{broken", bodyKind: "json" as const },
  ]) {
    const summary = evaluateAssertions(input, [
      assertion({ type: "JSON_PATH", operator: "EXISTS", target: "ok", expectedValue: null }),
    ]);
    assert.deepEqual([summary.total, summary.passed, summary.failed], [1, 0, 1]);
    assert.ok(summary.results[0].message.length > 0);
  }
});

test("HTTP error responses still evaluate assertions and disabled rules are omitted", () => {
  const summary = evaluateAssertions(
    { ...response, status: 404, statusText: "Not Found" },
    [
      assertion({ type: "STATUS_CODE", operator: "EQUALS", expectedValue: "404" }),
      assertion({ type: "STATUS_CODE", operator: "EQUALS", expectedValue: "200", enabled: false }),
    ],
  );
  assert.deepEqual([summary.total, summary.passed, summary.failed], [1, 1, 0]);
});

test("assertion ownership filters can never escape the authenticated user's endpoint graph", () => {
  assert.deepEqual(assertionOwnedByUserWhere("user-a", "assertion-1"), {
    id: "assertion-1",
    endpoint: { collection: { userId: "user-a" } },
  });
  assert.notDeepEqual(
    assertionOwnedByUserWhere("user-a", "assertion-1"),
    assertionOwnedByUserWhere("user-b", "assertion-1"),
  );
  assert.throws(() => assertionOwnedByUserWhere("", "assertion-1"));
});

function assertion(overrides: Partial<AssertionDefinition> = {}): AssertionDefinition {
  return {
    type: "STATUS_CODE",
    operator: "EQUALS",
    target: null,
    expectedValue: "200",
    enabled: true,
    ...overrides,
  };
}
