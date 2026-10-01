import assert from "node:assert/strict";
import test from "node:test";

import {
  decryptSecretWithKey,
  EncryptionConfigurationError,
  encryptSecretWithKey,
  isEncryptedSecretPayload,
  MAX_ENCRYPTED_SECRET_BYTES,
  SecretDecryptionError,
  SecretEncryptionError,
} from "../src/lib/security/encryption-core";
import {
  InvalidHeaderSecretOperationError,
  planHeaderUpdate,
  prepareHeadersForCreate,
  resolveHeadersForExecution,
  toClientHeader,
  UnsafeStoredHeaderError,
  type HeaderDraft,
  type StoredHeaderRecord,
} from "../src/lib/security/request-header-secrets";
import {
  isSensitiveHeaderName,
  redactSensitiveHeaders,
  REDACTED_SECRET_VALUE,
} from "../src/lib/security/sensitive-headers";
import { endpointInputSchema } from "../src/lib/validation/phase2";
import {
  executeRequest,
  normalizeExecutionRequest,
  type RequestTransport,
} from "../src/lib/request-executor/executor";
import type { HostResolver } from "../src/lib/security/ssrf";

const keyA = Buffer.alloc(32, 0x11).toString("base64");
const keyB = Buffer.alloc(32, 0x22).toString("base64");

test("AES-256-GCM payloads round-trip, are versioned, and use a fresh nonce", () => {
  const plaintext = "Bearer phase-7-secret-🙂";
  const first = encryptSecretWithKey(plaintext, keyA);
  const second = encryptSecretWithKey(plaintext, keyA);

  assert.match(first, /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.equal(isEncryptedSecretPayload(first), true);
  assert.notEqual(first, second);
  assert.equal(first.includes(plaintext), false);
  assert.equal(decryptSecretWithKey(first, keyA), plaintext);
  assert.equal(decryptSecretWithKey(second, keyA), plaintext);
});

test("encryption rejects missing, malformed, short, empty, and oversized inputs", () => {
  for (const key of [undefined, "", "not-base64", Buffer.alloc(31).toString("base64")]) {
    assert.throws(() => encryptSecretWithKey("secret", key), EncryptionConfigurationError);
  }
  assert.throws(() => encryptSecretWithKey("", keyA), SecretEncryptionError);
  assert.throws(
    () => encryptSecretWithKey("a".repeat(MAX_ENCRYPTED_SECRET_BYTES + 1), keyA),
    SecretEncryptionError,
  );
});

test("decryption fails closed for wrong keys, tampering, and unsupported formats", () => {
  const payload = encryptSecretWithKey("sensitive", keyA);
  const tampered = `${payload.slice(0, -1)}${payload.endsWith("A") ? "B" : "A"}`;
  assert.throws(() => decryptSecretWithKey(payload, keyB), SecretDecryptionError);
  assert.throws(() => decryptSecretWithKey(tampered, keyA), SecretDecryptionError);
  assert.throws(() => decryptSecretWithKey(payload.replace(/^v1/, "v2"), keyA), SecretDecryptionError);
  assert.throws(() => decryptSecretWithKey("malformed", keyA), SecretDecryptionError);
});

test("the canonical classifier and redactor cover credential-bearing header families", () => {
  for (const name of [
    "Authorization",
    "Proxy-Authorization",
    "Cookie",
    "Set-Cookie",
    "X-API-Key",
    "X-Service-Api-Key",
    "X-Access-Token",
    "X-CSRF-Token",
    "X-Private-Key",
    "X-Database-Password",
    "Client-Secret",
  ]) {
    assert.equal(isSensitiveHeaderName(name), true, name);
  }
  for (const name of ["Accept", "Content-Type", "X-Token-Count", "Cache-Control"]) {
    assert.equal(isSensitiveHeaderName(name), false, name);
  }

  assert.deepEqual(
    redactSensitiveHeaders([
      { key: "Accept", value: "application/json" },
      { key: "Authorization", value: "Bearer never-log-this" },
      { key: "X-Custom", value: "manual", sensitive: true },
    ]),
    [
      { key: "Accept", value: "application/json" },
      { key: "Authorization", value: REDACTED_SECRET_VALUE },
      { key: "X-Custom", value: REDACTED_SECRET_VALUE, sensitive: true },
    ],
  );
});

test("new header persistence encrypts sensitive values and preserves ordinary headers", async () => {
  const writes = await prepareHeadersForCreate([
    draft({ key: "Accept", value: "application/json" }),
    draft({ key: "Authorization", value: "Bearer private", sensitive: true, secretOperation: "set" }),
  ], (value) => encryptSecretWithKey(value, keyA));

  assert.deepEqual(writes[0], {
    key: "Accept",
    value: "application/json",
    enabled: true,
    sensitive: false,
    valueKind: "PLAIN",
  });
  assert.equal(writes[1].valueKind, "ENCRYPTED");
  assert.equal(writes[1].sensitive, true);
  assert.equal(writes[1].value.includes("Bearer private"), false);
  assert.equal(decryptSecretWithKey(writes[1].value, keyA), "Bearer private");
});

test("saved secret updates keep ciphertext unchanged, replace it, and remove it explicitly", async () => {
  const encrypted = encryptSecretWithKey("old-secret", keyA);
  const stored = storedHeader(encrypted);

  const kept = await planHeaderUpdate(
    [stored],
    [draft({ id: stored.id, key: "Authorization", sensitive: true, secretOperation: "keep" })],
    (value) => encryptSecretWithKey(value, keyA),
  );
  assert.deepEqual(kept.keep, [{ id: stored.id, key: "Authorization", enabled: true, sensitive: true }]);
  assert.equal(kept.create.length, 0);
  assert.equal(stored.value, encrypted);

  const replaced = await planHeaderUpdate(
    [stored],
    [draft({ id: stored.id, key: "Authorization", value: "new-secret", sensitive: true, secretOperation: "set" })],
    (value) => encryptSecretWithKey(value, keyA),
  );
  assert.equal(replaced.keep.length, 0);
  assert.equal(replaced.create.length, 1);
  assert.notEqual(replaced.create[0].value, encrypted);
  assert.equal(decryptSecretWithKey(replaced.create[0].value, keyA), "new-secret");

  const cleared = await planHeaderUpdate(
    [stored],
    [draft({ id: stored.id, key: "Authorization", sensitive: true, secretOperation: "clear" })],
    (value) => encryptSecretWithKey(value, keyA),
  );
  assert.deepEqual(cleared, { keep: [], create: [] });
});

test("client DTOs and execution resolution never expose stored plaintext to the browser", async () => {
  const encrypted = encryptSecretWithKey("outbound-only", keyA);
  const stored = storedHeader(encrypted);
  const client = toClientHeader(stored);
  assert.equal(client.value, "");
  assert.equal(client.hasStoredSecret, true);
  assert.equal(JSON.stringify(client).includes("outbound-only"), false);
  assert.equal(JSON.stringify(client).includes(encrypted), false);

  const resolved = await resolveHeadersForExecution(
    [stored],
    [draft({ id: stored.id, key: "Authorization", sensitive: true, secretOperation: "keep" })],
    (value) => decryptSecretWithKey(value, keyA),
  );
  assert.equal(resolved[0].value, "outbound-only");
  assert.equal(resolved[0].sensitive, true);
});

test("saved secrets reach only the server-side outbound request and are stripped on cross-origin redirects", async () => {
  const encrypted = encryptSecretWithKey("outbound-only", keyA);
  const stored = storedHeader(encrypted);
  const headers = await resolveHeadersForExecution(
    [stored],
    [draft({ id: stored.id, key: "Authorization", sensitive: true, secretOperation: "keep" })],
    (value) => decryptSecretWithKey(value, keyA),
  );
  const request = {
    method: "GET" as const,
    url: "https://origin.example/resource",
    queryParameters: [],
    headers,
    body: null,
  };
  assert.equal(normalizeExecutionRequest(request).headers.authorization, "outbound-only");

  const observedAuthorization: Array<string | undefined> = [];
  const transport: RequestTransport = async (_target, normalized) => {
    observedAuthorization.push(normalized.headers.authorization);
    return observedAuthorization.length === 1
      ? {
          status: 302,
          statusText: "Found",
          headers: [{ key: "location", value: "https://redirect.example/final" }],
          body: Buffer.alloc(0),
          redirectLocation: "https://redirect.example/final",
        }
      : {
          status: 204,
          statusText: "No Content",
          headers: [],
          body: Buffer.alloc(0),
          redirectLocation: null,
        };
  };
  const resolver: HostResolver = async () => [{ address: "93.184.216.34", family: 4 }];
  const result = await executeRequest(request, { resolver, transport });
  assert.equal(result.ok, true);
  assert.deepEqual(observedAuthorization, ["outbound-only", undefined]);
});

test("unsafe legacy plaintext and foreign stored-header identifiers fail closed", async () => {
  assert.throws(
    () => toClientHeader({ ...storedHeader("Bearer plaintext"), valueKind: "PLAIN" }),
    UnsafeStoredHeaderError,
  );
  await assert.rejects(
    planHeaderUpdate(
      [storedHeader(encryptSecretWithKey("one", keyA))],
      [draft({ id: "another-user-header", key: "Authorization", sensitive: true, secretOperation: "keep" })],
      (value) => encryptSecretWithKey(value, keyA),
    ),
    InvalidHeaderSecretOperationError,
  );
});

test("Phase 7 validation requires explicit set/keep/clear semantics", () => {
  const base = {
    name: "Authenticated API",
    collectionId: "collection-a",
    method: "GET",
    url: "https://api.example.com",
    body: "",
    queryParameters: [],
  } as const;
  assert.equal(endpointInputSchema.safeParse({
    ...base,
    headers: [{ key: "Authorization", value: "Bearer secret", enabled: true, sensitive: true, secretOperation: "set" }],
  }).success, true);
  assert.equal(endpointInputSchema.safeParse({
    ...base,
    headers: [{ key: "Authorization", value: "", enabled: true, sensitive: true, secretOperation: "keep" }],
  }).success, false);
  assert.equal(endpointInputSchema.safeParse({
    ...base,
    headers: [{ id: "header-a", key: "Authorization", value: "", enabled: true, sensitive: true, secretOperation: "keep" }],
  }).success, true);
});

function draft(overrides: Partial<HeaderDraft> = {}): HeaderDraft {
  return {
    key: "Accept",
    value: "",
    enabled: true,
    sensitive: false,
    secretOperation: "plain",
    ...overrides,
  };
}

function storedHeader(value: string): StoredHeaderRecord {
  return {
    id: "header-a",
    key: "Authorization",
    value,
    enabled: true,
    sensitive: true,
    valueKind: "ENCRYPTED",
  };
}
