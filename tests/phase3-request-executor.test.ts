import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";

import {
  collectBoundedBody,
  executeRequest,
  normalizeExecutionRequest,
  ResponseTooLargeError,
  type RequestTransport,
  type TransportResponse,
} from "../src/lib/request-executor/executor";
import {
  acquireExecutionSlot,
  resetExecutionLimitsForTests,
} from "../src/lib/request-executor/rate-limit";
import { MAX_RESPONSE_BYTES } from "../src/lib/request-executor/limits";
import type { ExecutionRequestInput } from "../src/lib/request-executor/types";
import {
  isPublicAddress,
  resolveSafeTarget,
  type HostResolver,
} from "../src/lib/security/ssrf";
import { executionRequestSchema } from "../src/lib/validation/execution";

const publicResolver: HostResolver = async () => [{ address: "93.184.216.34", family: 4 }];

const baseRequest: ExecutionRequestInput = {
  method: "GET",
  url: "https://public.example/items?existing=yes",
  queryParameters: [
    { key: "page", value: "1", enabled: true },
    { key: "hidden", value: "no", enabled: false },
  ],
  headers: [
    { key: "Accept", value: "application/json", enabled: true, sensitive: false },
    { key: "X-Disabled", value: "ignored", enabled: false, sensitive: false },
  ],
  body: null,
};

test("execution validation rejects malformed, credential-bearing, and oversized input", () => {
  assert.equal(executionRequestSchema.safeParse(baseRequest).success, true);
  assert.equal(executionRequestSchema.safeParse({ ...baseRequest, method: "TRACE" }).success, false);
  assert.equal(executionRequestSchema.safeParse({ ...baseRequest, url: "file:///etc/passwd" }).success, false);
  assert.equal(executionRequestSchema.safeParse({ ...baseRequest, url: "https://user:pass@example.com" }).success, false);
  assert.equal(executionRequestSchema.safeParse({ ...baseRequest, body: "{" }).success, false);
  assert.equal(
    executionRequestSchema.safeParse({
      ...baseRequest,
      headers: [{ key: "Authorization", value: "Bearer secret", enabled: true, sensitive: true }],
    }).success,
    false,
  );
  assert.equal(
    executionRequestSchema.safeParse({ ...baseRequest, body: `"${"a".repeat(1_048_576)}"` }).success,
    false,
  );
});

test("request normalization safely applies parameters, headers, and JSON bodies", () => {
  const normalized = normalizeExecutionRequest(baseRequest);
  assert.equal(normalized.url.searchParams.get("existing"), "yes");
  assert.equal(normalized.url.searchParams.get("page"), "1");
  assert.equal(normalized.url.searchParams.has("hidden"), false);
  assert.equal(normalized.headers.accept, "application/json");
  assert.equal(normalized.headers["x-disabled"], undefined);
  assert.equal(normalized.headers["user-agent"], "API-Sentinel/1.0");

  const post = normalizeExecutionRequest({ ...baseRequest, method: "POST", body: '{"ok":true}' });
  assert.equal(post.body?.toString("utf8"), '{"ok":true}');
  assert.equal(post.headers["content-type"], "application/json");
  assert.equal(post.headers["content-length"], "11");

  assert.throws(
    () => normalizeExecutionRequest({ ...baseRequest, headers: [{ key: "Host", value: "evil", enabled: true, sensitive: false }] }),
    /managed by API Sentinel/,
  );
  assert.throws(
    () => normalizeExecutionRequest({ ...baseRequest, body: '{"not":"sent"}' }),
    /GET requests cannot include/,
  );
});

test("SSRF classification blocks local, private, link-local, metadata, and special addresses", async () => {
  const blocked = [
    "127.0.0.1",
    "10.2.3.4",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.2",
    "169.254.169.254",
    "100.64.0.1",
    "::1",
    "fc00::1",
    "fd00:ec2::254",
    "fe80::1",
    "::ffff:127.0.0.1",
  ];
  for (const address of blocked) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress("93.184.216.34"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);

  await assert.rejects(resolveSafeTarget("http://localhost", publicResolver), /private or internal/);
  await assert.rejects(resolveSafeTarget("http://metadata.google.internal", publicResolver), /private or internal/);
  await assert.rejects(
    resolveSafeTarget("https://mixed.example", async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "10.0.0.4", family: 4 },
    ]),
    /private or internal/,
  );
});

test("redirect destinations are revalidated before a second network request", async () => {
  let calls = 0;
  const transport: RequestTransport = async () => {
    calls += 1;
    return response(302, "Found", "", [{ key: "location", value: "http://internal.example/admin" }], "http://internal.example/admin");
  };
  const resolver: HostResolver = async (hostname) => hostname === "internal.example"
    ? [{ address: "127.0.0.1", family: 4 }]
    : [{ address: "93.184.216.34", family: 4 }];

  const result = await executeRequest(baseRequest, { resolver, transport });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "BLOCKED_TARGET");
  assert.equal(calls, 1);
});

test("timeout aborts execution and returns a normalized failure", async () => {
  const transport: RequestTransport = async (_target, _request, signal) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => {
        const error = new Error("aborted") as Error & { code: string };
        error.code = "ABORT_ERR";
        reject(error);
      }, { once: true });
    });

  const result = await executeRequest(baseRequest, {
    resolver: publicResolver,
    transport,
    timeoutMs: 10,
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "TIMEOUT");
});

test("timeout also bounds stalled hostname resolution", async () => {
  const result = await executeRequest(baseRequest, {
    resolver: async () => new Promise(() => undefined),
    transport: async () => response(200, "OK", "done"),
    timeoutMs: 10,
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "TIMEOUT");
});

test("bounded response reading enforces the 4 MiB default and custom limits", async () => {
  assert.equal(MAX_RESPONSE_BYTES, 4 * 1_048_576);

  const accepted = await collectBoundedBody(
    Readable.from([Buffer.alloc(MAX_RESPONSE_BYTES)]),
  );
  assert.equal(accepted.byteLength, MAX_RESPONSE_BYTES);

  await assert.rejects(
    collectBoundedBody(
      Readable.from([Buffer.alloc(MAX_RESPONSE_BYTES), Buffer.alloc(1)]),
    ),
    (error: unknown) => error instanceof ResponseTooLargeError &&
      error.message === "The target response exceeded the 4 MiB execution limit.",
  );

  const stream = Readable.from([Buffer.from("abc"), Buffer.from("def")]);
  await assert.rejects(collectBoundedBody(stream, 5), ResponseTooLargeError);
});

test("HTTP 404 and 500 remain valid target responses and malformed JSON remains safe text", async () => {
  for (const status of [404, 500]) {
    const result = await executeRequest(baseRequest, {
      resolver: publicResolver,
      transport: async () => response(status, status === 404 ? "Not Found" : "Internal Server Error", "{broken", [
        { key: "content-type", value: "application/json" },
      ]),
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.response.status, status);
      assert.equal(result.response.body, "{broken");
      assert.equal(result.response.bodyKind, "json");
    }
  }
});

test("per-user execution guard limits rate and concurrent work independently", () => {
  resetExecutionLimitsForTests();
  const slots = Array.from({ length: 4 }, () => acquireExecutionSlot("user-a", 1_000));
  assert.equal(slots.every((slot) => slot.allowed), true);
  const blocked = acquireExecutionSlot("user-a", 1_000);
  assert.deepEqual(blocked, { allowed: false, reason: "CONCURRENCY_LIMIT" });
  const otherUser = acquireExecutionSlot("user-b", 1_000);
  assert.equal(otherUser.allowed, true);
  for (const slot of slots) if (slot.allowed) slot.release();
  if (otherUser.allowed) otherUser.release();
});

function response(
  status: number,
  statusText: string,
  body: string,
  headers: Array<{ key: string; value: string }> = [],
  redirectLocation: string | null = null,
): TransportResponse {
  return { status, statusText, body: Buffer.from(body), headers, redirectLocation };
}

