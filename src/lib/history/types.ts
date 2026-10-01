import type { AssertionOperatorValue, AssertionTypeValue } from "../assertions/types";
import type { ExecutionMethod, ResponseBodyKind } from "../request-executor/types";

export type StoredExecutionStatus =
  | "SUCCESS"
  | "HTTP_RESPONSE"
  | "TIMEOUT"
  | "DNS_ERROR"
  | "CONNECTION_ERROR"
  | "TLS_ERROR"
  | "INVALID_REQUEST"
  | "RESPONSE_TOO_LARGE"
  | "BLOCKED_TARGET"
  | "INTERNAL_ERROR";

export interface HistoryAssertionResult {
  id: string;
  type: AssertionTypeValue;
  operator: AssertionOperatorValue | null;
  target: string | null;
  label: string | null;
  position: number;
  passed: boolean;
  expected: string | null;
  actual: string | null;
  message: string | null;
}

export interface HistoryListItem {
  id: string;
  endpointId: string | null;
  endpointName: string;
  method: ExecutionMethod;
  url: string;
  statusCode: number | null;
  statusText: string | null;
  durationMs: number | null;
  responseSizeBytes: number | null;
  executionStatus: StoredExecutionStatus;
  errorCode: string | null;
  createdAt: string;
  assertions: { total: number; passed: number; failed: number };
}

export interface HistoryPageData {
  items: HistoryListItem[];
  nextCursor: string | null;
  invalidCursor: boolean;
}

export interface HistoryDetail extends HistoryListItem {
  finalUrl: string | null;
  redirectCount: number | null;
  responseContentType: string | null;
  responseBodyKind: ResponseBodyKind | null;
  responseBody: string | null;
  responseBodyTruncated: boolean;
  errorMessage: string | null;
  assertionResults: HistoryAssertionResult[];
}

