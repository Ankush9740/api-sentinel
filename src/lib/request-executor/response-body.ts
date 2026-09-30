import type { ResponseBodyKind } from "./types";

interface NormalizedResponseBody {
  body: string;
  bodyKind: ResponseBodyKind;
}

const textualApplicationTypes = new Set([
  "application/graphql",
  "application/javascript",
  "application/sql",
  "application/x-httpd-php",
  "application/x-javascript",
  "application/x-ndjson",
  "application/x-sh",
  "application/x-www-form-urlencoded",
  "application/xml",
]);

export function normalizeResponseBody(
  bytes: Buffer,
  contentType: string | null,
): NormalizedResponseBody {
  if (bytes.byteLength === 0) return { body: "", bodyKind: "empty" };

  const mediaType = parseMediaType(contentType);
  const decoded = decodeUtf8(bytes);

  if (isJsonMediaType(mediaType)) {
    return decoded === null
      ? { body: "", bodyKind: "binary" }
      : { body: decoded, bodyKind: "json" };
  }

  if (isTextualMediaType(mediaType)) {
    return decoded === null
      ? { body: "", bodyKind: "binary" }
      : { body: decoded, bodyKind: appearsJson(decoded) ? "json" : "text" };
  }

  if (mediaType) return { body: "", bodyKind: "binary" };
  if (decoded === null || !appearsSafeText(decoded)) {
    return { body: "", bodyKind: "binary" };
  }

  return { body: decoded, bodyKind: appearsJson(decoded) ? "json" : "text" };
}

export function parseMediaType(contentType: string | null) {
  return contentType?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

export function isJsonMediaType(mediaType: string) {
  return mediaType === "application/json" || mediaType.endsWith("+json");
}

export function isTextualMediaType(mediaType: string) {
  return mediaType.startsWith("text/") ||
    mediaType.endsWith("+xml") ||
    textualApplicationTypes.has(mediaType);
}

function decodeUtf8(bytes: Buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function appearsJson(value: string) {
  return /^[\s]*[\[{]/.test(value);
}

function appearsSafeText(value: string) {
  if (value.includes("\0")) return false;
  let controls = 0;
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) controls += 1;
  }
  return controls / Math.max(value.length, 1) < 0.01;
}
