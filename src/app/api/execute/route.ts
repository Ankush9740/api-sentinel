import { NextResponse } from "next/server";

import { evaluateAssertions } from "@/lib/assertions/evaluator";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { executeRequest } from "@/lib/request-executor/executor";
import { MAX_EXECUTION_PAYLOAD_BYTES } from "@/lib/request-executor/limits";
import { acquireExecutionSlot } from "@/lib/request-executor/rate-limit";
import type { ExecutionFailure } from "@/lib/request-executor/types";
import { executionRequestSchema } from "@/lib/validation/execution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let user;
  try {
    user = await getAuthenticatedUser();
  } catch {
    return NextResponse.json(
      failure("INTERNAL_ERROR", "Your session could not be verified. Sign in again."),
      { status: 401 },
    );
  }

  if (!user) {
    return NextResponse.json(
      failure("INVALID_REQUEST", "Sign in to execute requests."),
      { status: 401 },
    );
  }

  const slot = acquireExecutionSlot(user.id);
  if (!slot.allowed) {
    const message = slot.reason === "CONCURRENCY_LIMIT"
      ? "Too many requests are already running. Wait for one to finish."
      : "Execution limit reached. Try again in a minute.";
    return NextResponse.json(failure("RATE_LIMITED", message), { status: 429 });
  }

  try {
    const payload = await readBoundedJson(request);
    const parsed = executionRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ...failure("INVALID_REQUEST", "Correct the request configuration and try again."),
          error: {
            code: "INVALID_REQUEST" as const,
            message: "Correct the request configuration and try again.",
            fieldErrors: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 },
      );
    }

    const result = await executeRequest(parsed.data);
    if (!result.ok) return NextResponse.json(result);

    return NextResponse.json({
      ...result,
      assertions: evaluateAssertions(result.response, parsed.data.assertions),
    });
  } catch (error) {
    if (error instanceof ExecutionPayloadError) {
      return NextResponse.json(failure("INVALID_REQUEST", error.message), { status: error.status });
    }
    return NextResponse.json(
      failure("INTERNAL_ERROR", "The request could not be completed safely. Try again."),
      { status: 500 },
    );
  } finally {
    slot.release();
  }
}

class ExecutionPayloadError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

async function readBoundedJson(request: Request) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_EXECUTION_PAYLOAD_BYTES) {
    throw new ExecutionPayloadError("The execution request is too large.", 413);
  }

  if (!request.body) throw new ExecutionPayloadError("A request configuration is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_EXECUTION_PAYLOAD_BYTES) {
        await reader.cancel();
        throw new ExecutionPayloadError("The execution request is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(combined)) as unknown;
  } catch {
    throw new ExecutionPayloadError("The execution request must contain valid JSON.");
  }
}

function failure(code: ExecutionFailure["error"]["code"], message: string): ExecutionFailure {
  return { ok: false, error: { code, message } };
}

