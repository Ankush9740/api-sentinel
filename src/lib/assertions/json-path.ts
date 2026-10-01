export const MAX_JSON_PATH_SEGMENTS = 32;

const forbiddenPathSegments = new Set(["__proto__", "prototype", "constructor"]);
const arrayIndexPattern = /^(?:0|[1-9]\d*)$/;

/**
 * Parses the deliberately small JSON-path subset supported by assertions.
 *
 * Supported examples:
 * - user.id
 * - $.user.id
 * - items.0.id
 * - $.items[0].id
 *
 * This is declarative traversal only; filters, wildcards, expressions, and
 * quoted bracket properties are intentionally unsupported.
 */
export function parseJsonPathSegments(input: string): string[] | null {
  let path = input.trim();
  if (path === "$") return [];
  if (path.startsWith("$.")) path = path.slice(2);
  else if (path.startsWith("$[")) path = path.slice(1);
  else if (path.startsWith("$")) return null;
  if (!path) return null;

  const segments: string[] = [];
  let cursor = 0;

  while (cursor < path.length) {
    if (path[cursor] === "." || path[cursor] === "]") return null;

    if (path[cursor] === "[") {
      const closingBracket = path.indexOf("]", cursor + 1);
      if (closingBracket === -1) return null;
      const index = path.slice(cursor + 1, closingBracket);
      if (!arrayIndexPattern.test(index)) return null;
      segments.push(index);
      cursor = closingBracket + 1;
    } else {
      const start = cursor;
      while (cursor < path.length && path[cursor] !== "." && path[cursor] !== "[") {
        if (path[cursor] === "]" || /\s/.test(path[cursor])) return null;
        cursor += 1;
      }
      const segment = path.slice(start, cursor);
      if (!segment) return null;
      segments.push(segment);
    }

    if (segments.length > MAX_JSON_PATH_SEGMENTS) return null;
    if (cursor === path.length) break;
    if (path[cursor] === ".") {
      cursor += 1;
      if (cursor === path.length || path[cursor] === "." || path[cursor] === "[") return null;
      continue;
    }
    if (path[cursor] !== "[") return null;
  }

  if (segments.some((segment) => forbiddenPathSegments.has(segment))) return null;
  return segments;
}
