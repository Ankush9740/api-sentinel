import * as http from "node:http";
import * as https from "node:https";
import { isIP } from "node:net";
import { performance } from "node:perf_hooks";

import {
  MAX_REDIRECTS,
  MAX_RESPONSE_BYTES,
  REQUEST_TIMEOUT_MS,
} from "./limits";
import { normalizeResponseBody } from "./response-body";
import type {
  ExecutionErrorCode,
  ExecutionFailure,
  ExecutionRequestInput,
  ExecutionResult,
} from "./types";
import {
  BlockedTargetError,
  DnsResolutionError,
  resolveSafeTarget,
  type HostResolver,
  type SafeTarget,
} from "../security/ssrf";

const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const unsupportedRequestHeaders = new Set([
  "connection",
  "content-length",
  "expect",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "accept-encoding",
]);

export interface NormalizedRequest {
  method: ExecutionRequestInput["method"];
  url: URL;
  headers: Record<string, string>;
  body: Buffer | null;
}

export interface TransportResponse {
  status: number;
  statusText: string;
  headers: Array<{ key: string; value: string }>;
  body: Buffer;
  redirectLocation: string | null;
}

export type RequestTransport = (
  target: SafeTarget,
  request: NormalizedRequest,
  signal: AbortSignal,
  maximumBytes: number,
) => Promise<TransportResponse>;

export interface ExecutorDependencies {
  resolver?: HostResolver;
  transport?: RequestTransport;
  timeoutMs?: number;
  maximumResponseBytes?: number;
  maximumRedirects?: number;
}

export class InvalidExecutionRequestError extends Error {
  readonly code = "INVALID_REQUEST";

  constructor(message: string) {
    super(message);
    this.name = "InvalidExecutionRequestError";
  }
}

export class ResponseTooLargeError extends Error {
  readonly code = "RESPONSE_TOO_LARGE";

  constructor() {
    super("The target response exceeded the 5 MB execution limit.");
    this.name = "ResponseTooLargeError";
  }
}

export function normalizeExecutionRequest(input: ExecutionRequestInput): NormalizedRequest {
  const url = new URL(input.url);
  for (const parameter of input.queryParameters) {
    if (parameter.enabled) url.searchParams.append(parameter.key, parameter.value);
  }

  const headers: Record<string, string> = {};
  for (const header of input.headers) {
    if (!header.enabled) continue;
    const normalizedName = header.key.trim().toLowerCase();
    if (unsupportedRequestHeaders.has(normalizedName)) {
      throw new InvalidExecutionRequestError(
        `The ${header.key.trim()} header is managed by API Sentinel and cannot be overridden.`,
      );
    }
    headers[normalizedName] = header.value;
  }

  const allowsBody = input.method !== "GET";
  if (!allowsBody && input.body) {
    throw new InvalidExecutionRequestError("GET requests cannot include a request body.");
  }

  const body = allowsBody && input.body ? Buffer.from(input.body, "utf8") : null;
  if (body && !headers["content-type"]) headers["content-type"] = "application/json";
  if (body) headers["content-length"] = String(body.byteLength);
  headers["accept-encoding"] = "identity";
  headers["user-agent"] = "API-Sentinel/1.0";

  return { method: input.method, url, headers, body };
}

export async function executeRequest(
  input: ExecutionRequestInput,
  dependencies: ExecutorDependencies = {},
): Promise<ExecutionResult> {
  const timeoutMs = dependencies.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const maximumBytes = dependencies.maximumResponseBytes ?? MAX_RESPONSE_BYTES;
  const maximumRedirects = dependencies.maximumRedirects ?? MAX_REDIRECTS;
  const transport = dependencies.transport ?? nodeTransport;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();

  try {
    let request = normalizeExecutionRequest(input);
    let redirectCount = 0;

    while (true) {
      const target = await waitForAbort(
        resolveSafeTarget(request.url, dependencies.resolver),
        controller.signal,
      );
      const response = await transport(target, request, controller.signal, maximumBytes);
      if (controller.signal.aborted) throw abortError();

      if (
        redirectStatuses.has(response.status) &&
        response.redirectLocation
      ) {
        if (redirectCount >= maximumRedirects) {
          throw new InvalidExecutionRequestError(
            `The target exceeded the ${maximumRedirects}-redirect limit.`,
          );
        }

        const nextUrl = new URL(response.redirectLocation, request.url);
        redirectCount += 1;
        request = redirectedRequest(request, nextUrl, response.status);
        continue;
      }

      const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
      const contentType = findHeader(response.headers, "content-type");
      const normalizedBody = normalizeResponseBody(response.body, contentType);

      return {
        ok: true,
        response: {
          status: response.status,
          statusText: response.statusText,
          durationMs,
          sizeBytes: response.body.byteLength,
          headers: response.headers,
          body: normalizedBody.body,
          bodyKind: normalizedBody.bodyKind,
          contentType,
          finalUrl: request.url.toString(),
          redirectCount,
        },
      };
    }
  } catch (error) {
    return normalizeExecutionFailure(error, controller.signal.aborted, timeoutMs);
  } finally {
    clearTimeout(timeout);
  }
}

export async function collectBoundedBody(
  source: AsyncIterable<Uint8Array>,
  maximumBytes = MAX_RESPONSE_BYTES,
) {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of source) {
    const buffer = Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > maximumBytes) throw new ResponseTooLargeError();
    chunks.push(buffer);
  }

  return Buffer.concat(chunks, size);
}

function redirectedRequest(
  request: NormalizedRequest,
  url: URL,
  status: number,
): NormalizedRequest {
  const convertToGet = status === 303 || ((status === 301 || status === 302) && request.method === "POST");
  const headers = { ...request.headers };
  if (request.url.origin !== url.origin) {
    for (const name of Object.keys(headers)) {
      if (!["accept", "accept-encoding", "content-length", "content-type", "user-agent"].includes(name)) {
        delete headers[name];
      }
    }
  }
  if (convertToGet) {
    delete headers["content-length"];
    delete headers["content-type"];
    return { ...request, method: "GET", url, body: null, headers };
  }
  return { ...request, url, headers };
}

function waitForAbort<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortError());

  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    operation.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

function abortError() {
  const error = new Error("Execution aborted") as Error & { code: string };
  error.code = "ABORT_ERR";
  return error;
}

function findHeader(headers: Array<{ key: string; value: string }>, name: string) {
  return headers.find((header) => header.key.toLowerCase() === name)?.value ?? null;
}

function normalizeExecutionFailure(
  error: unknown,
  timedOut: boolean,
  timeoutMs: number,
): ExecutionFailure {
  if (timedOut || isErrorCode(error, "ABORT_ERR")) {
    return failure("TIMEOUT", `The target API did not respond within ${timeoutMs / 1_000} seconds.`);
  }
  if (error instanceof BlockedTargetError) return failure("BLOCKED_TARGET", error.message);
  if (error instanceof DnsResolutionError) return failure("DNS_ERROR", error.message);
  if (error instanceof ResponseTooLargeError) return failure("RESPONSE_TOO_LARGE", error.message);
  if (error instanceof InvalidExecutionRequestError) return failure("INVALID_REQUEST", error.message);

  const code = getErrorCode(error);
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return failure("DNS_ERROR", "The target hostname could not be resolved.");
  }
  if (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "EHOSTUNREACH" ||
    code === "ENETUNREACH" ||
    code === "EPIPE"
  ) {
    return failure("CONNECTION_ERROR", "API Sentinel could not connect to the target server.");
  }
  if (
    code.startsWith("ERR_TLS") ||
    code.includes("CERT") ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    code === "DEPTH_ZERO_SELF_SIGNED_CERT"
  ) {
    return failure("TLS_ERROR", "The target server's secure connection could not be verified.");
  }
  return failure("INTERNAL_ERROR", "The request could not be completed safely. Try again.");
}

function failure(code: ExecutionErrorCode, message: string): ExecutionFailure {
  return { ok: false, error: { code, message } };
}

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return "";
}

function isErrorCode(error: unknown, code: string) {
  return getErrorCode(error) === code;
}

const nodeTransport: RequestTransport = (target, request, signal, maximumBytes) =>
  new Promise((resolve, reject) => {
    const hostname = normalizeServerName(target.url.hostname);
    const options: https.RequestOptions = {
      protocol: target.url.protocol,
      hostname,
      port: target.url.port || undefined,
      path: `${target.url.pathname}${target.url.search}`,
      method: request.method,
      headers: request.headers,
      agent: false,
      signal,
      family: target.family,
      lookup: (_hostname, _options, callback) => {
        callback(null, target.address, target.family);
      },
    };
    if (target.url.protocol === "https:" && !isIP(hostname)) options.servername = hostname;

    const handleResponse = async (response: http.IncomingMessage) => {
        const status = response.statusCode ?? 0;
        const redirectLocation = redirectStatuses.has(status) ? response.headers.location ?? null : null;
        if (redirectLocation) {
          response.destroy();
          resolve({
            status,
            statusText: response.statusMessage ?? "",
            headers: normalizeResponseHeaders(response.rawHeaders),
            body: Buffer.alloc(0),
            redirectLocation,
          });
          return;
        }

        const declaredLength = Number(response.headers["content-length"]);
        if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
          response.destroy();
          reject(new ResponseTooLargeError());
          return;
        }

        try {
          const body = await collectBoundedBody(response, maximumBytes);
          resolve({
            status,
            statusText: response.statusMessage ?? "",
            headers: normalizeResponseHeaders(response.rawHeaders),
            body,
            redirectLocation: null,
          });
        } catch (error) {
          response.destroy();
          reject(error);
        }
      };

    const outgoing = target.url.protocol === "https:"
      ? https.request(options, handleResponse)
      : http.request(options, handleResponse);

    outgoing.on("error", reject);
    if (request.body) outgoing.write(request.body);
    outgoing.end();
  });

function normalizeServerName(hostname: string) {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
}

function normalizeResponseHeaders(rawHeaders: string[]) {
  const headers: Array<{ key: string; value: string }> = [];
  for (let index = 0; index < rawHeaders.length; index += 2) {
    headers.push({
      key: rawHeaders[index].toLowerCase(),
      value: rawHeaders[index + 1] ?? "",
    });
  }
  return headers;
}

