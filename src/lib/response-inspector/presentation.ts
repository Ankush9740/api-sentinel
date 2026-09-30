import type {
  ExecutionErrorCode,
  ResponseBodyKind,
} from "../request-executor/types";

export interface PreparedResponseBody {
  display: string;
  malformedJson: boolean;
}

export interface ExecutionErrorPresentation {
  title: string;
  guidance: string;
}

export function prepareResponseBody(
  body: string,
  bodyKind: ResponseBodyKind,
): PreparedResponseBody {
  if (bodyKind !== "json") return { display: body, malformedJson: false };

  try {
    return {
      display: JSON.stringify(JSON.parse(body) as unknown, null, 2),
      malformedJson: false,
    };
  } catch {
    return { display: body, malformedJson: true };
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) {
    return `${(bytes / 1_024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
  }
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function statusTone(status: number) {
  if (status >= 200 && status < 300) return "success" as const;
  if (status >= 300 && status < 500) return "warning" as const;
  return "danger" as const;
}

export function executionErrorPresentation(
  code: ExecutionErrorCode,
): ExecutionErrorPresentation {
  const presentations: Record<ExecutionErrorCode, ExecutionErrorPresentation> = {
    INVALID_REQUEST: {
      title: "Invalid request",
      guidance: "Review the URL and request configuration, then try again.",
    },
    BLOCKED_TARGET: {
      title: "Request blocked",
      guidance: "Use a public HTTP or HTTPS endpoint that does not resolve to an internal network.",
    },
    TIMEOUT: {
      title: "Request timed out",
      guidance: "Check whether the target is available, then retry the request.",
    },
    DNS_ERROR: {
      title: "Hostname not found",
      guidance: "Check the hostname for typing errors or DNS availability.",
    },
    CONNECTION_ERROR: {
      title: "Connection failed",
      guidance: "Confirm the target is online and accepting connections at this URL.",
    },
    TLS_ERROR: {
      title: "Secure connection failed",
      guidance: "The target must present a valid TLS certificate before API Sentinel can connect.",
    },
    RESPONSE_TOO_LARGE: {
      title: "Response too large",
      guidance: "Request a smaller resource or use query parameters to reduce the response.",
    },
    RATE_LIMITED: {
      title: "Execution limit reached",
      guidance: "Wait briefly for active requests or the execution window to clear.",
    },
    INTERNAL_ERROR: {
      title: "Execution failed",
      guidance: "Retry the request. If it continues to fail, review the request configuration.",
    },
  };
  return presentations[code];
}
