import { isEncryptedSecretPayload } from "./encryption-core";
import { isSensitiveHeaderName } from "./sensitive-headers";

export type HeaderSecretOperation = "plain" | "set" | "keep" | "clear";
export type StoredHeaderValueKind = "PLAIN" | "ENCRYPTED";

export interface HeaderDraft {
  id?: string | null;
  key: string;
  value: string;
  enabled: boolean;
  sensitive: boolean;
  secretOperation: HeaderSecretOperation;
}

export interface StoredHeaderRecord {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  sensitive: boolean;
  valueKind: StoredHeaderValueKind;
}

export interface StoredHeaderWrite {
  key: string;
  value: string;
  enabled: boolean;
  sensitive: boolean;
  valueKind: StoredHeaderValueKind;
}

export class InvalidHeaderSecretOperationError extends Error {
  constructor() {
    super("The sensitive header change is invalid or no longer available.");
    this.name = "InvalidHeaderSecretOperationError";
  }
}

export class UnsafeStoredHeaderError extends Error {
  constructor() {
    super("A sensitive header was found in an unsafe storage representation.");
    this.name = "UnsafeStoredHeaderError";
  }
}

export async function prepareHeadersForCreate(
  drafts: HeaderDraft[],
  encrypt: (plaintext: string) => string | Promise<string>,
) {
  const writes: StoredHeaderWrite[] = [];
  for (const draft of drafts) {
    if (draft.id || draft.secretOperation === "keep" || draft.secretOperation === "clear") {
      throw new InvalidHeaderSecretOperationError();
    }
    writes.push(await prepareWrite(draft, encrypt));
  }
  return writes;
}

export async function planHeaderUpdate(
  existing: StoredHeaderRecord[],
  drafts: HeaderDraft[],
  encrypt: (plaintext: string) => string | Promise<string>,
) {
  const existingById = new Map(existing.map((header) => [header.id, header]));
  const suppliedIds = new Set<string>();
  const keep: Array<{ id: string; key: string; enabled: boolean; sensitive: true }> = [];
  const create: StoredHeaderWrite[] = [];

  for (const draft of drafts) {
    const stored = draft.id ? existingById.get(draft.id) : undefined;
    if (draft.id) {
      if (!stored || suppliedIds.has(draft.id)) throw new InvalidHeaderSecretOperationError();
      suppliedIds.add(draft.id);
    }

    if (draft.secretOperation === "clear") {
      if (!stored || stored.valueKind !== "ENCRYPTED") {
        throw new InvalidHeaderSecretOperationError();
      }
      continue;
    }

    if (draft.secretOperation === "keep") {
      if (
        !stored ||
        stored.valueKind !== "ENCRYPTED" ||
        !stored.sensitive ||
        !isEncryptedSecretPayload(stored.value) ||
        !isDraftSensitive(draft)
      ) {
        throw new InvalidHeaderSecretOperationError();
      }
      keep.push({ id: stored.id, key: draft.key, enabled: draft.enabled, sensitive: true });
      continue;
    }

    create.push(await prepareWrite(draft, encrypt));
  }

  return { keep, create };
}

export function toClientHeader(header: StoredHeaderRecord) {
  const sensitive = header.sensitive || isSensitiveHeaderName(header.key);
  if (header.valueKind === "ENCRYPTED") {
    if (!header.sensitive || !isEncryptedSecretPayload(header.value)) {
      throw new UnsafeStoredHeaderError();
    }
    return {
      id: header.id,
      key: header.key,
      value: "",
      enabled: header.enabled,
      sensitive: true,
      hasStoredSecret: true,
    };
  }
  if (sensitive) throw new UnsafeStoredHeaderError();
  return {
    id: header.id,
    key: header.key,
    value: header.value,
    enabled: header.enabled,
    sensitive: false,
    hasStoredSecret: false,
  };
}

export async function resolveHeadersForExecution(
  existing: StoredHeaderRecord[],
  drafts: HeaderDraft[],
  decrypt: (payload: string) => string | Promise<string>,
) {
  const existingById = new Map(existing.map((header) => [header.id, header]));
  const suppliedIds = new Set<string>();
  const resolved: Array<{ key: string; value: string; enabled: boolean; sensitive: boolean }> = [];

  for (const draft of drafts) {
    const stored = draft.id ? existingById.get(draft.id) : undefined;
    if (draft.id) {
      if (!stored || suppliedIds.has(draft.id)) throw new InvalidHeaderSecretOperationError();
      suppliedIds.add(draft.id);
    }

    if (draft.secretOperation === "clear") continue;
    if (draft.secretOperation === "keep") {
      if (
        !stored ||
        stored.valueKind !== "ENCRYPTED" ||
        !stored.sensitive ||
        !isEncryptedSecretPayload(stored.value) ||
        !isDraftSensitive(draft)
      ) {
        throw new InvalidHeaderSecretOperationError();
      }
      resolved.push({
        key: draft.key,
        value: await decrypt(stored.value),
        enabled: draft.enabled,
        sensitive: true,
      });
      continue;
    }

    if (draft.secretOperation === "set" && !isDraftSensitive(draft)) {
      throw new InvalidHeaderSecretOperationError();
    }
    if (draft.secretOperation === "plain" && isDraftSensitive(draft)) {
      throw new InvalidHeaderSecretOperationError();
    }
    resolved.push({
      key: draft.key,
      value: draft.value,
      enabled: draft.enabled,
      sensitive: isDraftSensitive(draft),
    });
  }
  return resolved;
}

async function prepareWrite(
  draft: HeaderDraft,
  encrypt: (plaintext: string) => string | Promise<string>,
): Promise<StoredHeaderWrite> {
  const sensitive = isDraftSensitive(draft);
  if (draft.secretOperation === "plain" && !sensitive) {
    return {
      key: draft.key,
      value: draft.value,
      enabled: draft.enabled,
      sensitive: false,
      valueKind: "PLAIN",
    };
  }
  if (draft.secretOperation === "set" && sensitive && draft.value) {
    return {
      key: draft.key,
      value: await encrypt(draft.value),
      enabled: draft.enabled,
      sensitive: true,
      valueKind: "ENCRYPTED",
    };
  }
  throw new InvalidHeaderSecretOperationError();
}

function isDraftSensitive(draft: Pick<HeaderDraft, "key" | "sensitive">) {
  return draft.sensitive || isSensitiveHeaderName(draft.key);
}
