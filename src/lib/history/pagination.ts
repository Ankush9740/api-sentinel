export interface HistoryCursor {
  createdAt: Date;
  id: string;
}

const MAX_CURSOR_LENGTH = 512;

export function encodeHistoryCursor(cursor: HistoryCursor) {
  return Buffer.from(
    JSON.stringify({ createdAt: cursor.createdAt.toISOString(), id: cursor.id }),
    "utf8",
  ).toString("base64url");
}

export function decodeHistoryCursor(value: string | null | undefined): HistoryCursor | null {
  if (!value || value.length > MAX_CURSOR_LENGTH) return null;

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      createdAt?: unknown;
      id?: unknown;
    };
    if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") return null;
    if (!parsed.id.trim() || parsed.id.length > 191) return null;
    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

export function historyCursorWhere(cursor: HistoryCursor) {
  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ],
  };
}

