export type SessionIdentity = {
  user?: {
    id?: string | null;
  } | null;
} | null;

export class UnauthenticatedError extends Error {
  constructor() {
    super("An authenticated server session is required.");
    this.name = "UnauthenticatedError";
  }
}

export function getSessionUserId(session: SessionIdentity) {
  const userId = session?.user?.id?.trim();
  return userId ? userId : null;
}

export function requireSessionUserId(session: SessionIdentity) {
  const userId = getSessionUserId(session);

  if (!userId) {
    throw new UnauthenticatedError();
  }

  return userId;
}

export function ownedByUser<T extends Record<string, unknown>>(
  authenticatedUserId: string,
  filters: T,
) {
  const userId = authenticatedUserId.trim();

  if (!userId) {
    throw new UnauthenticatedError();
  }

  return { ...filters, userId } as Omit<T, "userId"> & { userId: string };
}

export function endpointOwnedByUser(authenticatedUserId: string) {
  const userId = authenticatedUserId.trim();

  if (!userId) {
    throw new UnauthenticatedError();
  }

  return {
    collection: {
      userId,
    },
  } as const;
}
