import assert from "node:assert/strict";
import test from "node:test";

import {
  collectionOwnedByUserWhere,
  endpointOwnedByUserWhere,
} from "../src/lib/collections/ownership";
import {
  collectionInputSchema,
  endpointInputSchema,
} from "../src/lib/validation/phase2";

test("collection validation normalizes safe persisted input", () => {
  const result = collectionInputSchema.parse({
    name: "  Authentication API  ",
    description: "  Login and session requests.  ",
  });

  assert.deepEqual(result, {
    name: "Authentication API",
    description: "Login and session requests.",
  });
  assert.equal(collectionInputSchema.safeParse({ name: "   ", description: "" }).success, false);
});

test("saved endpoint validation accepts Phase 2 request configuration", () => {
  const result = endpointInputSchema.parse({
    name: "List users",
    collectionId: "collection-a",
    method: "GET",
    url: "https://api.example.com/users",
    body: "",
    queryParameters: [{ key: "page", value: "1", enabled: true }],
    headers: [{ key: "Accept", value: "application/json", enabled: true, sensitive: false }],
  });

  assert.equal(result.body, null);
  assert.equal(result.queryParameters[0].key, "page");
  assert.equal(result.headers[0].key, "Accept");
});

test("saved endpoint validation rejects unsafe or out-of-scope input", () => {
  const base = {
    name: "Example",
    collectionId: "collection-a",
    method: "GET",
    url: "https://api.example.com",
    body: "",
    queryParameters: [],
    headers: [],
  };

  assert.equal(endpointInputSchema.safeParse({ ...base, method: "TRACE" }).success, false);
  assert.equal(endpointInputSchema.safeParse({ ...base, url: "file:///etc/passwd" }).success, false);
  assert.equal(
    endpointInputSchema.safeParse({ ...base, url: "https://user:password@api.example.com" }).success,
    false,
  );
  assert.equal(endpointInputSchema.safeParse({ ...base, body: "{" }).success, false);
  assert.equal(
    endpointInputSchema.safeParse({
      ...base,
      body: JSON.stringify({ value: "🙂".repeat(300_000) }),
    }).success,
    false,
  );
  assert.equal(
    endpointInputSchema.safeParse({
      ...base,
      headers: [{ key: "X-Test", value: "one\r\ntwo", enabled: true, sensitive: false }],
    }).success,
    false,
  );
  for (const value of ["one\0two", "emoji-🙂"]) {
    assert.equal(
      endpointInputSchema.safeParse({
        ...base,
        headers: [{ key: "X-Test", value, enabled: true, sensitive: false }],
      }).success,
      false,
    );
  }
  assert.equal(
    endpointInputSchema.safeParse({
      ...base,
      headers: [{ key: "Authorization", value: "Bearer secret", enabled: true, sensitive: true }],
    }).success,
    false,
  );
});

test("ownership filters always derive scope from the authenticated identity", () => {
  assert.deepEqual(collectionOwnedByUserWhere("user-a", "collection-1"), {
    id: "collection-1",
    userId: "user-a",
  });
  assert.deepEqual(endpointOwnedByUserWhere("user-a", "endpoint-1"), {
    id: "endpoint-1",
    collection: { userId: "user-a" },
  });
  assert.notDeepEqual(
    endpointOwnedByUserWhere("user-a", "endpoint-1"),
    endpointOwnedByUserWhere("user-b", "endpoint-1"),
  );
  assert.throws(() => collectionOwnedByUserWhere("", "collection-1"));
});
