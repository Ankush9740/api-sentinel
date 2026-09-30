import assert from "node:assert/strict";

import { executeRequest } from "../src/lib/request-executor/executor";
import type { ExecutionMethod, ExecutionRequestInput } from "../src/lib/request-executor/types";

const base: Omit<ExecutionRequestInput, "method" | "url"> = {
  queryParameters: [],
  headers: [],
  body: null,
};

const methodResults: Record<string, number> = {};
for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"] as ExecutionMethod[]) {
  const result = await executeRequest({
    ...base,
    method,
    url: "https://httpbin.org/anything",
    queryParameters: [{ key: "phase", value: "3", enabled: true }],
    headers: [{ key: "X-API-Sentinel-Test", value: "safe", enabled: true, sensitive: false }],
    body: method === "GET" ? null : '{"phase":3}',
  });
  assert.equal(result.ok, true, `${method} should complete: ${JSON.stringify(result)}`);
  if (result.ok) {
    assert.equal(result.response.status, 200);
    methodResults[method] = result.response.status;
  }
}

const notFound = await executeRequest({ ...base, method: "GET", url: "https://httpbin.org/status/404" });
assert.equal(notFound.ok, true);
let notFoundStatus: number | string = "unexpected-failure";
if (notFound.ok) {
  assert.equal(notFound.response.status, 404);
  notFoundStatus = notFound.response.status;
}

const text = await executeRequest({ ...base, method: "GET", url: "https://httpbin.org/robots.txt" });
assert.equal(text.ok, true);
let textContentType: string | null = null;
if (text.ok) {
  assert.equal(text.response.status, 200);
  assert.equal(text.response.bodyKind, "text");
  assert.ok(text.response.body.length > 0);
  textContentType = text.response.contentType;
}

const blockedRedirect = await executeRequest({
  ...base,
  method: "GET",
  url: "https://httpbin.org/redirect-to?url=http%3A%2F%2F127.0.0.1%2F",
});
assert.equal(blockedRedirect.ok, false);
if (!blockedRedirect.ok) assert.equal(blockedRedirect.error.code, "BLOCKED_TARGET");

const dnsFailure = await executeRequest({ ...base, method: "GET", url: "https://not-a-real-host.invalid/" });
assert.equal(dnsFailure.ok, false);
if (!dnsFailure.ok) assert.equal(dnsFailure.error.code, "DNS_ERROR");

const timeout = await executeRequest({
  ...base,
  method: "GET",
  url: `https://httpbin.org/delay/15?verification=${Date.now()}`,
});
assert.equal(timeout.ok, false);
if (!timeout.ok) assert.equal(timeout.error.code, "TIMEOUT");

const oversized = await executeRequest({
  ...base,
  method: "GET",
  url: "https://speed.cloudflare.com/__down?bytes=6000000",
});
assert.equal(oversized.ok, false);
if (!oversized.ok) assert.equal(oversized.error.code, "RESPONSE_TOO_LARGE");

console.log(JSON.stringify({
  methods: methodResults,
  notFound: notFoundStatus,
  text: textContentType,
  blockedRedirect: blockedRedirect.ok ? "unexpected-success" : blockedRedirect.error.code,
  dnsFailure: dnsFailure.ok ? "unexpected-success" : dnsFailure.error.code,
  timeout: timeout.ok ? "unexpected-success" : timeout.error.code,
  oversized: oversized.ok ? "unexpected-success" : oversized.error.code,
}));

