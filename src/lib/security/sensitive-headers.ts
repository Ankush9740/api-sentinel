const exactSensitiveHeaderNames = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "api-key",
  "apikey",
  "x-auth-token",
  "x-access-token",
]);

const sensitiveHeaderSuffixPattern =
  /(?:^|[-_])(?:password|passwd|secret|token|private[-_]?key)$/i;
const apiKeySuffixPattern = /api[-_]?key$/i;
const subscriptionKeySuffixPattern = /subscription[-_]?key$/i;

export const MASKED_SECRET_VALUE = "••••••••";
export const REDACTED_SECRET_VALUE = "[REDACTED]";

export function isSensitiveHeaderName(name: string) {
  const normalized = name.trim().toLowerCase();
  return exactSensitiveHeaderNames.has(normalized) ||
    sensitiveHeaderSuffixPattern.test(normalized) ||
    apiKeySuffixPattern.test(normalized) ||
    subscriptionKeySuffixPattern.test(normalized);
}

export function redactSensitiveHeaders<T extends { key: string; value: string; sensitive?: boolean }>(
  headers: T[],
) {
  return headers.map((header) =>
    header.sensitive || isSensitiveHeaderName(header.key)
      ? { ...header, value: REDACTED_SECRET_VALUE }
      : { ...header },
  );
}
