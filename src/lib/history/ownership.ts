import { UnauthenticatedError } from "../auth/authorization";

export function requestRunOwnedByUserWhere(
  authenticatedUserId: string,
  requestRunId?: string,
) {
  const userId = authenticatedUserId.trim();
  if (!userId) throw new UnauthenticatedError();
  return requestRunId ? { id: requestRunId, userId } : { userId };
}

