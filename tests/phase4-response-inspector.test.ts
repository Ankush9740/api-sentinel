import assert from "node:assert/strict";
import test from "node:test";

import { executeRequest, type RequestTransport } from "../src/lib/request-executor/executor";
import { normalizeResponseBody } from "../src/lib/request-executor/response-body";
import type {
  ExecutionErrorCode,
  ExecutionRequestInput,
} from "../src/lib/request-executor/types";
import {
  executionErrorPresentation,
  formatBytes,
  prepareResponseBody,
  statusTone,
} from "../src/lib/response-inspector/presentation";

test("normal, nested, and array JSON is formatted without changing its values", () => {
  const inputs = [
    '{"ok":true,"count":2}',
    '{"user":{"profile":{"name":"Ada"}},"items":[1,2]}',
    '[{"id":1},{"id":2}]',
  ];

  for (const input of inputs) {
    const normalized = normalizeResponseBody(Buffer.from(input), "application/json; charset=utf-8");
    assert.equal(normalized.bodyKind, "json");
    const prepared = prepareResponseBody(normalized.body, normalized.bodyKind);
    assert.equal(prepared.malformedJson, false);
    assert.deepEqual(JSON.parse(prepared.display), JSON.parse(input));
    assert.match(prepared.display, /\n/);
  }
});

test("plain text and HTML remain inert text with whitespace preserved", () => {
  const body = "first line\n  indented\n<script>alert('never run')</script>";
  for (const type of ["text/plain", "text/html; charset=utf-8", "application/xml"]) {
    const normalized = normalizeResponseBody(Buffer.from(body), type);
    assert.equal(normalized.bodyKind, "text");
    assert.equal(prepareResponseBody(normalized.body, normalized.bodyKind).display, body);
  }
});

test("empty, malformed JSON, and unsupported binary bodies have intentional states", () => {
  assert.deepEqual(normalizeResponseBody(Buffer.alloc(0), "application/json"), {
    body: "",
    bodyKind: "empty",
  });

  const malformed = normalizeResponseBody(Buffer.from('{"broken":'), "application/problem+json");
  assert.equal(malformed.bodyKind, "json");
  assert.deepEqual(prepareResponseBody(malformed.body, malformed.bodyKind), {
    display: '{"broken":',
    malformedJson: true,
  });

  for (const type of ["application/octet-stream", "image/png", "application/pdf"]) {
    const binary = normalizeResponseBody(Buffer.from([0, 1, 2, 255]), type);
    assert.deepEqual(binary, { body: "", bodyKind: "binary" });
  }
  assert.deepEqual(normalizeResponseBody(Buffer.from([0, 255]), null), {
    body: "",
    bodyKind: "binary",
  });
});

test("JSON-like bodies without a content type are detected and unknown media stays binary", () => {
  assert.equal(normalizeResponseBody(Buffer.from("  [1,2,3]"), null).bodyKind, "json");
  assert.equal(normalizeResponseBody(Buffer.from("readable text"), null).bodyKind, "text");
  assert.equal(normalizeResponseBody(Buffer.from("readable text"), "application/vnd.unknown").bodyKind, "binary");
});

test("status, size, and every normalized execution error receive stable presentation", () => {
  assert.equal(statusTone(204), "success");
  assert.equal(statusTone(302), "warning");
  assert.equal(statusTone(401), "warning");
  assert.equal(statusTone(500), "danger");
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(1_536), "1.5 KB");
  assert.equal(formatBytes(5 * 1_048_576), "5.0 MB");

  const codes: ExecutionErrorCode[] = [
    "INVALID_REQUEST",
    "BLOCKED_TARGET",
    "TIMEOUT",
    "DNS_ERROR",
    "CONNECTION_ERROR",
    "TLS_ERROR",
    "RESPONSE_TOO_LARGE",
    "RATE_LIMITED",
    "INTERNAL_ERROR",
  ];
  for (const code of codes) {
    const presentation = executionErrorPresentation(code);
    assert.ok(presentation.title.length > 0, code);
    assert.ok(presentation.guidance.length > 0, code);
  }
});

test("2xx, 4xx, and 5xx responses remain inspectable HTTP results", async () => {
  const input: ExecutionRequestInput = {
    method: "GET",
    url: "https://public.example/status",
    queryParameters: [],
    headers: [],
    body: null,
  };

  for (const status of [200, 401, 500]) {
    const result = await executeRequest(input, {
      resolver: async () => [{ address: "93.184.216.34", family: 4 }],
      transport: async () => ({
        status,
        statusText: status === 200 ? "OK" : status === 401 ? "Unauthorized" : "Internal Server Error",
        headers: [{ key: "content-type", value: "application/json" }],
        body: Buffer.from(`{"status":${status}}`),
        redirectLocation: null,
      }),
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.response.status, status);
      assert.equal(result.response.bodyKind, "json");
      assert.deepEqual(JSON.parse(prepareResponseBody(result.response.body, "json").display), { status });
    }
  }
});

test("long and numerous response headers are preserved exactly", async () => {
  const headers = Array.from({ length: 64 }, (_, index) => ({
    key: `x-header-${index}`,
    value: index === 0 ? "value-".repeat(800) : `value-${index}`,
  }));
  const transport: RequestTransport = async () => ({
    status: 429,
    statusText: "Too Many Requests",
    headers,
    body: Buffer.from('{"retry":true}'),
    redirectLocation: null,
  });
  const input: ExecutionRequestInput = {
    method: "GET",
    url: "https://public.example/rate-limited",
    queryParameters: [],
    headers: [],
    body: null,
  };

  const result = await executeRequest(input, {
    resolver: async () => [{ address: "93.184.216.34", family: 4 }],
    transport,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.response.status, 429);
    assert.equal(result.response.headers.length, 64);
    assert.deepEqual(result.response.headers, headers);
    assert.equal(result.response.bodyKind, "json");
  }
});

