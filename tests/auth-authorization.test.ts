import assert from "node:assert/strict";
import test from "node:test";

import {
  endpointOwnedByUser,
  getSessionUserId,
  ownedByUser,
  requireSessionUserId,
  UnauthenticatedError,
} from "../src/lib/auth/authorization";

test("session identity only comes from a non-empty server session user id", () => {
  assert.equal(getSessionUserId(null), null);
  assert.equal(getSessionUserId({ user: null }), null);
  assert.equal(getSessionUserId({ user: { id: "   " } }), null);
  assert.equal(getSessionUserId({ user: { id: " user_123 " } }), "user_123");
});

test("requiring an identity rejects missing or invalid sessions", () => {
  assert.throws(() => requireSessionUserId(null), UnauthenticatedError);
  assert.throws(
    () => requireSessionUserId({ user: { id: "" } }),
    UnauthenticatedError,
  );
  assert.equal(requireSessionUserId({ user: { id: "user_123" } }), "user_123");
});

test("direct ownership constraints cannot be overridden by browser filters", () => {
  assert.deepEqual(
    ownedByUser("server_user", { id: "collection_123", userId: "browser_user" }),
    { id: "collection_123", userId: "server_user" },
  );
});

test("endpoint ownership is constrained through its parent collection", () => {
  assert.deepEqual(endpointOwnedByUser("server_user"), {
    collection: { userId: "server_user" },
  });
  assert.throws(() => endpointOwnedByUser("  "), UnauthenticatedError);
});
