import {
  EXECUTIONS_PER_MINUTE,
  MAX_CONCURRENT_EXECUTIONS,
} from "./limits";

interface ExecutionBucket {
  windowStartedAt: number;
  count: number;
  active: number;
}

export type ExecutionSlot =
  | { allowed: false; reason: "RATE_LIMIT" | "CONCURRENCY_LIMIT" }
  | { allowed: true; release: () => void };

const buckets = new Map<string, ExecutionBucket>();

export function acquireExecutionSlot(userId: string, now = Date.now()): ExecutionSlot {
  const existing = buckets.get(userId);
  const bucket = !existing || now - existing.windowStartedAt >= 60_000
    ? { windowStartedAt: now, count: 0, active: existing?.active ?? 0 }
    : existing;

  if (bucket.count >= EXECUTIONS_PER_MINUTE) {
    buckets.set(userId, bucket);
    return { allowed: false, reason: "RATE_LIMIT" };
  }
  if (bucket.active >= MAX_CONCURRENT_EXECUTIONS) {
    buckets.set(userId, bucket);
    return { allowed: false, reason: "CONCURRENCY_LIMIT" };
  }

  bucket.count += 1;
  bucket.active += 1;
  buckets.set(userId, bucket);
  let released = false;

  return {
    allowed: true,
    release: () => {
      if (released) return;
      released = true;
      bucket.active = Math.max(0, bucket.active - 1);
    },
  };
}

export function resetExecutionLimitsForTests() {
  buckets.clear();
}

