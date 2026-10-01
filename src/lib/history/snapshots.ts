import type { AssertionRunSummary } from "../assertions/types";
import type {
  ExecutionFailure,
  ExecutionMethod,
  ExecutionResult,
} from "../request-executor/types";
import { MAX_PERSISTED_RESPONSE_BODY_BYTES } from "./constants";
import type { StoredExecutionStatus } from "./types";

interface SavedExecutionIdentity {
  endpointId: string;
  endpointName: string;
  userId: string;
  method: ExecutionMethod;
  url: string;
}

export function buildSavedRunSnapshot(
  identity: SavedExecutionIdentity,
  execution: ExecutionResult,
  assertions: AssertionRunSummary | null,
) {
  const base = {
    endpointId: identity.endpointId,
    endpointName: boundedText(identity.endpointName, 100),
    userId: identity.userId,
    method: identity.method,
    url: sanitizeHistoryUrl(identity.url),
  };

  if (execution.ok === false) {
    return {
      ...base,
      executionStatus: executionStatusForFailure(execution),
      errorCode: execution.error.code,
      errorMessage: boundedText(execution.error.message, 1_024),
      assertionResults: { create: [] },
    };
  }

  const body = boundedResponseBody(execution.response.body, execution.response.bodyKind);
  return {
    ...base,
    finalUrl: sanitizeHistoryUrl(execution.response.finalUrl),
    statusCode: execution.response.status,
    statusText: boundedText(execution.response.statusText, 256),
    durationMs: execution.response.durationMs,
    responseSizeBytes: BigInt(execution.response.sizeBytes),
    responseContentType: boundedNullableText(execution.response.contentType, 512),
    responseBodyKind: execution.response.bodyKind,
    responseBody: body.value,
    responseBodyTruncated: body.truncated,
    redirectCount: execution.response.redirectCount,
    executionStatus: execution.response.status >= 200 && execution.response.status < 300
      ? "SUCCESS" as const
      : "HTTP_RESPONSE" as const,
    assertionResults: {
      create: (assertions?.results ?? []).map((result, position) => ({
        type: result.type,
        operator: result.operator,
        target: boundedNullableText(result.target, 256),
        label: boundedText(result.label, 1_024),
        position,
        passed: result.passed,
        expected: boundedNullableText(result.expected, 1_024),
        actual: boundedNullableText(result.actual, 1_024),
        message: boundedText(result.message, 1_024),
      })),
    },
  };
}

export function sanitizeHistoryUrl(value: string) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "Invalid URL";
  }
}

export function boundedResponseBody(
  value: string,
  bodyKind: "json" | "text" | "empty" | "binary",
) {
  if (bodyKind === "binary") return { value: null, truncated: false };

  const bytes = Buffer.from(value, "utf8");
  if (bytes.byteLength <= MAX_PERSISTED_RESPONSE_BODY_BYTES) {
    return { value, truncated: false };
  }

  let end = MAX_PERSISTED_RESPONSE_BODY_BYTES;
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end -= 1;
  return { value: bytes.subarray(0, end).toString("utf8"), truncated: true };
}

function executionStatusForFailure(
  execution: ExecutionFailure,
): StoredExecutionStatus {
  return execution.error.code === "RATE_LIMITED"
    ? "INTERNAL_ERROR"
    : execution.error.code;
}

function boundedNullableText(value: string | null, maximum: number) {
  return value === null ? null : boundedText(value, maximum);
}

function boundedText(value: string, maximum: number) {
  return value.length > maximum ? value.slice(0, maximum) : value;
}

