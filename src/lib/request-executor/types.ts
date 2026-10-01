import type { HTTP_METHODS } from "../validation/phase2";
import type { AssertionRunSummary } from "../assertions/types";

export type ExecutionMethod = (typeof HTTP_METHODS)[number];

export interface ExecutionRow {
  key: string;
  value: string;
  enabled: boolean;
}

export interface ExecutionHeader extends ExecutionRow {
  sensitive: boolean;
}

export interface ExecutionRequestInput {
  method: ExecutionMethod;
  url: string;
  queryParameters: ExecutionRow[];
  headers: ExecutionHeader[];
  body: string | null;
}

export type ExecutionErrorCode =
  | "INVALID_REQUEST"
  | "BLOCKED_TARGET"
  | "TIMEOUT"
  | "DNS_ERROR"
  | "CONNECTION_ERROR"
  | "TLS_ERROR"
  | "RESPONSE_TOO_LARGE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ResponseBodyKind = "json" | "text" | "empty" | "binary";

export interface ExecutionSuccess {
  ok: true;
  response: {
    status: number;
    statusText: string;
    durationMs: number;
    sizeBytes: number;
    headers: Array<{ key: string; value: string }>;
    body: string;
    bodyKind: ResponseBodyKind;
    contentType: string | null;
    finalUrl: string;
    redirectCount: number;
  };
}

export interface ExecutionFailure {
  ok: false;
  error: {
    code: ExecutionErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export type ExecutionResult = ExecutionSuccess | ExecutionFailure;

export interface ExecutionApiSuccess extends ExecutionSuccess {
  assertions: AssertionRunSummary;
}

export type ExecutionApiResult = ExecutionApiSuccess | ExecutionFailure;

