export const NEW_REQUEST_QUERY_PARAM = "newRequest";

interface NewRequestHrefOptions {
  collectionId?: string | null;
  requestKey?: string;
}

interface WorkspaceInstanceKeyOptions {
  endpointId?: string | null;
  endpointUpdatedAt?: string | null;
  requestKey?: string | null;
  collectionId?: string | null;
}

export function createNewRequestHref({
  collectionId,
  requestKey = globalThis.crypto.randomUUID(),
}: NewRequestHrefOptions = {}) {
  const params = new URLSearchParams({ [NEW_REQUEST_QUERY_PARAM]: requestKey });

  if (collectionId) params.set("collection", collectionId);

  return `/workspace?${params.toString()}`;
}

export function getWorkspaceInstanceKey({
  endpointId,
  endpointUpdatedAt,
  requestKey,
  collectionId,
}: WorkspaceInstanceKeyOptions) {
  if (endpointId) {
    return `saved-request:${endpointId}:${endpointUpdatedAt ?? ""}`;
  }

  return `new-request:${requestKey ?? "initial"}:${collectionId ?? ""}`;
}

export function createFreshWorkspaceState() {
  return {
    activeTab: "params",
    method: "GET" as const,
    url: "",
    body: "",
    queryParameters: [],
    headers: [],
    assertions: [],
    endpointName: "Untitled request",
    draftName: "",
    saveDialogOpen: false,
    feedback: null,
    responseTab: "body",
    executionResult: null,
    isExecuting: false,
  };
}
