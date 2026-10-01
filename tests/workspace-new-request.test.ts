import assert from "node:assert/strict";
import test from "node:test";

import {
  createFreshWorkspaceState,
  createNewRequestHref,
  getWorkspaceInstanceKey,
  NEW_REQUEST_QUERY_PARAM,
} from "../src/lib/workspace/new-request";

function workspaceKeyFromHref(href: string) {
  const url = new URL(href, "https://api-sentinel.test");

  return getWorkspaceInstanceKey({
    requestKey: url.searchParams.get(NEW_REQUEST_QUERY_PARAM),
    collectionId: url.searchParams.get("collection"),
  });
}

test("repeated new-request actions remount an already-open unsaved workspace", () => {
  const firstHref = createNewRequestHref({ requestKey: "first-click" });
  const secondHref = createNewRequestHref({ requestKey: "second-click" });

  assert.equal(new URL(firstHref, "https://api-sentinel.test").pathname, "/workspace");
  assert.notEqual(workspaceKeyFromHref(firstHref), workspaceKeyFromHref(secondHref));
});

test("a fresh workspace clears response and execution state", () => {
  const state = createFreshWorkspaceState();

  assert.equal(state.responseTab, "body");
  assert.equal(state.executionResult, null);
  assert.equal(state.isExecuting, false);
  assert.equal(state.feedback, null);
  assert.equal(state.saveDialogOpen, false);
});

test("a fresh workspace clears request configuration and restores defaults", () => {
  const state = createFreshWorkspaceState();

  assert.equal(state.method, "GET");
  assert.equal(state.url, "");
  assert.equal(state.body, "");
  assert.deepEqual(state.queryParameters, []);
  assert.deepEqual(state.headers, []);
  assert.deepEqual(state.assertions, []);
  assert.equal(state.endpointName, "Untitled request");
});

test("new-request actions from other routes target a fresh workspace", () => {
  const href = createNewRequestHref({
    collectionId: "collection-123",
    requestKey: "from-collection",
  });
  const url = new URL(href, "https://api-sentinel.test");

  assert.equal(url.pathname, "/workspace");
  assert.equal(url.searchParams.get("collection"), "collection-123");
  assert.equal(url.searchParams.get(NEW_REQUEST_QUERY_PARAM), "from-collection");
  assert.equal(url.searchParams.has("endpoint"), false);
});

test("saved-request navigation retains its endpoint-specific workspace identity", () => {
  const savedKey = getWorkspaceInstanceKey({
    endpointId: "endpoint-123",
    endpointUpdatedAt: "2026-10-01T12:00:00.000Z",
    requestKey: "ignored-for-saved-request",
  });
  const updatedSavedKey = getWorkspaceInstanceKey({
    endpointId: "endpoint-123",
    endpointUpdatedAt: "2026-10-01T12:01:00.000Z",
  });

  assert.equal(
    savedKey,
    "saved-request:endpoint-123:2026-10-01T12:00:00.000Z",
  );
  assert.notEqual(savedKey, updatedSavedKey);
  assert.notEqual(
    savedKey,
    workspaceKeyFromHref(createNewRequestHref({ requestKey: "fresh-after-saved" })),
  );
});
