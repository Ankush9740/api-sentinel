import type {
  ExecutionHeader,
  ExecutionResult,
  ResponseBodyKind,
} from "../request-executor/types";
import { REDACTED_SECRET_VALUE } from "./sensitive-headers";

/**
 * Removes outbound sensitive header values from target-controlled response data.
 *
 * A target can echo request headers in its body or response headers. Stored
 * credentials are decrypted only for the outbound request, so reflected values
 * must be removed before assertions run, history is persisted, or the result is
 * returned to the browser.
 */
export function redactExecutionResultSecrets(
  result: ExecutionResult,
  requestHeaders: ExecutionHeader[],
): ExecutionResult {
  const secrets = uniqueSecrets(requestHeaders);
  if (secrets.length === 0) return result;
  const redact = createSecretRedactor(secrets);

  if (result.ok === false) {
    return {
      ...result,
      error: {
        ...result.error,
        message: redact(result.error.message),
      },
    };
  }

  return {
    ...result,
    response: {
      ...result.response,
      statusText: redact(result.response.statusText),
      headers: result.response.headers.map((header) => ({
        key: redact(header.key),
        value: redact(header.value),
      })),
      body: redactBody(result.response.body, result.response.bodyKind, redact),
      contentType: result.response.contentType === null
        ? null
        : redact(result.response.contentType),
      finalUrl: redactUrl(result.response.finalUrl, redact),
    },
  };
}

function uniqueSecrets(headers: ExecutionHeader[]) {
  return [...new Set(
    headers
      .filter((header) => header.enabled && header.sensitive && header.value.length > 0)
      .map((header) => header.value),
  )].sort((left, right) => right.length - left.length);
}

type SecretRedactor = (value: string) => string;

function redactBody(value: string, bodyKind: ResponseBodyKind, redact: SecretRedactor) {
  if (!value) return value;

  if (bodyKind === "json") {
    try {
      const parsed = JSON.parse(value) as unknown;
      const redacted = redactJsonValue(parsed, redact);
      if (redacted.changed) return JSON.stringify(redacted.value);
    } catch {
      // Malformed JSON remains safely displayable as text and is redacted below.
    }
  }

  return redact(value);
}

function createSecretRedactor(secrets: string[]): SecretRedactor {
  const variants = secrets.flatMap(secretVariants);
  const matches = [...new Set(variants.map((variant) => variant.literal))]
    .sort((left, right) => right.length - left.length);
  const sources = [...new Set(variants.map((variant) => variant.pattern))]
    .sort((left, right) => right.length - left.length);

  const pattern = new RegExp(
    sources.join("|"),
    "g",
  );
  const replacement = chooseSafeReplacement(matches);

  // Replace all credentials in one pass so a mask cannot be reprocessed as a
  // different credential. If replacement joins surrounding text into another
  // credential, collapse that individual field to the safe mask.
  return (value) => {
    pattern.lastIndex = 0;
    const redacted = value.replace(pattern, () => replacement);
    pattern.lastIndex = 0;
    const stillContainsSecret = pattern.test(redacted);
    pattern.lastIndex = 0;
    return stillContainsSecret ? replacement : redacted;
  };
}

function secretVariants(secret: string) {
  const literals = [secret, JSON.stringify(secret).slice(1, -1)];
  const encoded: string[] = [];
  try {
    const componentEncoded = encodeURIComponent(secret);
    const formEncoded = new URLSearchParams([["value", secret]]).toString().slice(6);
    encoded.push(componentEncoded, formEncoded);
  } catch {
    // Invalid legacy Unicode can still be redacted in raw and JSON-escaped form.
  }
  return [
    ...literals
      .filter((literal) => literal.length > 0)
      .map((literal) => ({ literal, pattern: escapeRegExp(literal) })),
    ...encoded
      .filter((literal) => literal.length > 0)
      .map((literal) => ({ literal, pattern: encodedVariantPattern(literal) })),
  ];
}

function encodedVariantPattern(value: string) {
  let pattern = "";
  for (let index = 0; index < value.length;) {
    const escape = value.slice(index, index + 3);
    if (/^%[0-9A-Fa-f]{2}$/.test(escape)) {
      pattern += `%${hexPattern(escape[1])}${hexPattern(escape[2])}`;
      index += 3;
      continue;
    }
    pattern += escapeRegExp(value[index]);
    index += 1;
  }
  return pattern;
}

function hexPattern(value: string) {
  return /[A-Fa-f]/.test(value)
    ? `[${value.toUpperCase()}${value.toLowerCase()}]`
    : value;
}

function redactUrl(value: string, redact: SecretRedactor) {
  let decoded = value;
  for (let depth = 0; depth < 3; depth += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }

  const decodedRedaction = redact(decoded);
  return decodedRedaction === decoded ? redact(value) : decodedRedaction;
}

function chooseSafeReplacement(matches: string[]) {
  const maximumLength = Math.min(...matches.map((match) => match.length));
  for (const candidate of [
    REDACTED_SECRET_VALUE,
    "[MASKED]",
    "<hidden>",
    "••••",
    "*",
    "#",
    "x",
    "_",
    "~",
    "•",
  ]) {
    if (
      candidate.length <= maximumLength
      && matches.every((match) => !candidate.includes(match))
    ) return candidate;
  }
  return "";
}

function redactJsonValue(root: unknown, redact: SecretRedactor) {
  if (typeof root === "string") {
    const value = redact(root);
    return { value, changed: value !== root };
  }
  if (root === null || typeof root !== "object") {
    return { value: root, changed: false };
  }

  const clone: unknown[] | Record<string, unknown> = Array.isArray(root)
    ? []
    : Object.create(null) as Record<string, unknown>;
  const pending: Array<{
    source: unknown[] | Record<string, unknown>;
    target: unknown[] | Record<string, unknown>;
  }> = [{ source: root as unknown[] | Record<string, unknown>, target: clone }];
  let changed = false;

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) break;

    for (const [key, item] of Object.entries(current.source)) {
      const redactedKey = Array.isArray(current.source) ? key : redact(key);
      if (redactedKey !== key) changed = true;

      if (typeof item === "string") {
        const redactedItem = redact(item);
        if (redactedItem !== item) changed = true;
        setJsonValue(current.target, redactedKey, redactedItem);
        continue;
      }

      if (item !== null && typeof item === "object") {
        const child: unknown[] | Record<string, unknown> = Array.isArray(item)
          ? []
          : Object.create(null) as Record<string, unknown>;
        setJsonValue(current.target, redactedKey, child);
        pending.push({
          source: item as unknown[] | Record<string, unknown>,
          target: child,
        });
        continue;
      }

      setJsonValue(current.target, redactedKey, item);
    }
  }

  return { value: clone, changed };
}

function setJsonValue(
  target: unknown[] | Record<string, unknown>,
  key: string,
  value: unknown,
) {
  if (Array.isArray(target)) {
    target[Number(key)] = value;
    return;
  }
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
