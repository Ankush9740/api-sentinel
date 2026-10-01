import { UnauthenticatedError } from "../auth/authorization";

function requireOwnerId(authenticatedUserId: string) {
  const userId = authenticatedUserId.trim();
  if (!userId) throw new UnauthenticatedError();
  return userId;
}

export function collectionOwnedByUserWhere(
  authenticatedUserId: string,
  collectionId?: string,
) {
  const userId = requireOwnerId(authenticatedUserId);
  return collectionId ? { id: collectionId, userId } : { userId };
}

export function endpointOwnedByUserWhere(
  authenticatedUserId: string,
  endpointId?: string,
) {
  const userId = requireOwnerId(authenticatedUserId);
  return endpointId
    ? { id: endpointId, collection: { userId } }
    : { collection: { userId } };
}

export function assertionOwnedByUserWhere(
  authenticatedUserId: string,
  assertionId?: string,
) {
  const userId = requireOwnerId(authenticatedUserId);
  const owner = { endpoint: { collection: { userId } } };
  return assertionId ? { id: assertionId, ...owner } : owner;
}
