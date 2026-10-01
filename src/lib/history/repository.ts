import "server-only";

import type { AssertionRunSummary } from "../assertions/types";
import { endpointOwnedByUserWhere } from "../collections/ownership";
import { prisma } from "../db/prisma";
import type { ExecutionResult, ResponseBodyKind } from "../request-executor/types";
import type { ValidatedExecutionRequest } from "../validation/execution";
import {
  HISTORY_PAGE_SIZE,
  MAX_HISTORY_RUNS_PER_ENDPOINT,
  MAX_HISTORY_RUNS_PER_USER,
} from "./constants";
import {
  decodeHistoryCursor,
  encodeHistoryCursor,
  historyCursorWhere,
} from "./pagination";
import { requestRunOwnedByUserWhere } from "./ownership";
import { buildSavedRunSnapshot } from "./snapshots";
import type {
  HistoryDetail,
  HistoryListItem,
  HistoryPageData,
} from "./types";

export async function getHistoryEndpointForUser(
  authenticatedUserId: string,
  endpointId: string,
) {
  return prisma.endpoint.findFirst({
    where: endpointOwnedByUserWhere(authenticatedUserId, endpointId),
    select: { id: true, name: true },
  });
}

export async function persistSavedRequestRun(
  authenticatedUserId: string,
  endpoint: { id: string; name: string },
  input: ValidatedExecutionRequest,
  execution: ExecutionResult,
  assertions: AssertionRunSummary | null,
) {
  const data = buildSavedRunSnapshot(
    {
      endpointId: endpoint.id,
      endpointName: endpoint.name,
      userId: authenticatedUserId,
      method: input.method,
      url: input.url,
    },
    execution,
    assertions,
  );

  return prisma.$transaction(async (transaction) => {
    // Retention is scoped per user. Serialize that user's writers so concurrent
    // executions cannot each observe the pre-commit count and exceed either cap.
    await transaction.$queryRaw<Array<{ acquired: boolean }>>`
      WITH retention_lock AS (
        SELECT pg_advisory_xact_lock(hashtextextended(${authenticatedUserId}, 0))
      )
      SELECT TRUE AS acquired FROM retention_lock
    `;

    const run = await transaction.requestRun.create({
      data,
      select: { id: true },
    });

    const endpointRetained = await transaction.requestRun.findMany({
      where: { userId: authenticatedUserId, endpointId: endpoint.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: MAX_HISTORY_RUNS_PER_ENDPOINT,
      select: { id: true },
    });
    if (endpointRetained.length === MAX_HISTORY_RUNS_PER_ENDPOINT) {
      await transaction.requestRun.deleteMany({
        where: {
          userId: authenticatedUserId,
          endpointId: endpoint.id,
          id: { notIn: endpointRetained.map((item) => item.id) },
        },
      });
    }

    const userRetained = await transaction.requestRun.findMany({
      where: requestRunOwnedByUserWhere(authenticatedUserId),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: MAX_HISTORY_RUNS_PER_USER,
      select: { id: true },
    });
    if (userRetained.length === MAX_HISTORY_RUNS_PER_USER) {
      await transaction.requestRun.deleteMany({
        where: {
          userId: authenticatedUserId,
          id: { notIn: userRetained.map((item) => item.id) },
        },
      });
    }

    return run;
  });
}

export async function listHistoryForUser(
  authenticatedUserId: string,
  encodedCursor?: string,
): Promise<HistoryPageData> {
  const cursor = decodeHistoryCursor(encodedCursor);
  if (encodedCursor && !cursor) {
    return { items: [], nextCursor: null, invalidCursor: true };
  }

  const runs = await prisma.requestRun.findMany({
    where: {
      ...requestRunOwnedByUserWhere(authenticatedUserId),
      ...(cursor ? historyCursorWhere(cursor) : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: HISTORY_PAGE_SIZE + 1,
    select: {
      id: true,
      endpointId: true,
      endpointName: true,
      endpoint: { select: { name: true } },
      method: true,
      url: true,
      statusCode: true,
      statusText: true,
      durationMs: true,
      responseSizeBytes: true,
      executionStatus: true,
      errorCode: true,
      createdAt: true,
      assertionResults: { select: { passed: true } },
    },
  });

  const hasNextPage = runs.length > HISTORY_PAGE_SIZE;
  const pageRuns = hasNextPage ? runs.slice(0, HISTORY_PAGE_SIZE) : runs;
  const last = pageRuns.at(-1);

  return {
    items: pageRuns.map(toHistoryListItem),
    nextCursor: hasNextPage && last
      ? encodeHistoryCursor({ createdAt: last.createdAt, id: last.id })
      : null,
    invalidCursor: false,
  };
}

export async function getHistoryRunForUser(
  authenticatedUserId: string,
  runId: string,
): Promise<HistoryDetail | null> {
  const run = await prisma.requestRun.findFirst({
    where: requestRunOwnedByUserWhere(authenticatedUserId, runId),
    select: {
      id: true,
      endpointId: true,
      endpointName: true,
      endpoint: { select: { name: true } },
      method: true,
      url: true,
      finalUrl: true,
      statusCode: true,
      statusText: true,
      durationMs: true,
      responseSizeBytes: true,
      responseContentType: true,
      responseBodyKind: true,
      responseBody: true,
      responseBodyTruncated: true,
      redirectCount: true,
      executionStatus: true,
      errorCode: true,
      errorMessage: true,
      createdAt: true,
      assertionResults: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          type: true,
          operator: true,
          target: true,
          label: true,
          position: true,
          passed: true,
          expected: true,
          actual: true,
          message: true,
        },
      },
    },
  });

  if (!run) return null;
  const item = toHistoryListItem(run);
  return {
    ...item,
    finalUrl: run.finalUrl,
    redirectCount: run.redirectCount,
    responseContentType: run.responseContentType,
    responseBodyKind: responseBodyKind(run.responseBodyKind),
    responseBody: run.responseBody,
    responseBodyTruncated: run.responseBodyTruncated,
    errorMessage: run.errorMessage,
    assertionResults: run.assertionResults,
  };
}

function toHistoryListItem(run: {
  id: string;
  endpointId: string | null;
  endpointName: string | null;
  endpoint: { name: string } | null;
  method: HistoryListItem["method"];
  url: string;
  statusCode: number | null;
  statusText: string | null;
  durationMs: number | null;
  responseSizeBytes: bigint | null;
  executionStatus: HistoryListItem["executionStatus"];
  errorCode: string | null;
  createdAt: Date;
  assertionResults: Array<{ passed: boolean }>;
}): HistoryListItem {
  const passed = run.assertionResults.filter((result) => result.passed).length;
  return {
    id: run.id,
    endpointId: run.endpointId,
    endpointName: run.endpointName ?? run.endpoint?.name ?? "Deleted request",
    method: run.method,
    url: run.url,
    statusCode: run.statusCode,
    statusText: run.statusText,
    durationMs: run.durationMs,
    responseSizeBytes: run.responseSizeBytes === null ? null : Number(run.responseSizeBytes),
    executionStatus: run.executionStatus,
    errorCode: run.errorCode,
    createdAt: run.createdAt.toISOString(),
    assertions: {
      total: run.assertionResults.length,
      passed,
      failed: run.assertionResults.length - passed,
    },
  };
}

function responseBodyKind(value: string | null): ResponseBodyKind | null {
  return value === "json" || value === "text" || value === "empty" || value === "binary"
    ? value
    : null;
}

