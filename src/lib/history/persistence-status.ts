import type { HistoryPersistenceStatus } from "../request-executor/types";

export async function persistHistorySafely(
  operation: () => Promise<{ id: string }>,
  onError?: (error: unknown) => void,
): Promise<HistoryPersistenceStatus> {
  try {
    const run = await operation();
    return { persisted: true, runId: run.id };
  } catch (error) {
    onError?.(error);
    return {
      persisted: false,
      message: "The execution result is available, but this run could not be saved to history.",
    };
  }
}

