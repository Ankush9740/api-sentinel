import Link from "next/link";

import { ChevronRightIcon, HistoryIcon } from "@/components/icons";
import { MethodBadge } from "@/components/collections/method-badge";
import { Badge } from "@/components/ui/badge";
import { FeedbackState } from "@/components/ui/feedback-state";
import type { HistoryPageData, HistoryListItem } from "@/lib/history/types";
import { formatBytes, statusTone } from "@/lib/response-inspector/presentation";

export function HistoryList({ page }: { page: HistoryPageData }) {
  return (
    <div className="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-[1680px] bg-workspace px-4 py-7 sm:px-7 sm:py-8 lg:px-8">
      <header className="mb-5 sm:mb-6">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-text-subtle">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          Request runs
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-text">Execution history</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-text-muted">
          Inspect bounded snapshots from saved requests. Newest executions appear first.
        </p>
      </header>

      <section aria-labelledby="history-list-title" className="overflow-hidden rounded-[22px] border border-border-strong bg-surface-raised shadow-[0_2px_8px_rgba(75,60,39,0.045)]">
        <h2 id="history-list-title" className="sr-only">Saved request execution history</h2>
        {page.invalidCursor ? (
          <FeedbackState
            tone="error"
            icon={<HistoryIcon className="size-5" />}
            title="That history page is unavailable"
            description="The pagination link is invalid or expired. Return to the newest request runs."
            action={<Link href="/history" className="text-sm font-semibold text-accent-soft underline underline-offset-4">View newest runs</Link>}
          />
        ) : page.items.length === 0 ? (
          <FeedbackState
            icon={<HistoryIcon className="size-5" />}
            title="No saved-request runs yet"
            description="Open a saved request in the workspace and send it. Its response and assertion result snapshot will appear here."
            action={<Link href="/workspace" className="text-sm font-semibold text-accent-soft underline underline-offset-4">Open workspace</Link>}
          />
        ) : (
          <>
            <div role="row" className="hidden grid-cols-[minmax(15rem,2fr)_6rem_7rem_7rem_9rem_1.5rem] gap-4 border-b border-border bg-surface-subtle/45 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-subtle lg:grid">
              <span role="columnheader">Request</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Duration</span>
              <span role="columnheader">Tests</span>
              <span role="columnheader">Executed</span>
              <span aria-hidden="true" />
            </div>
            <ol className="divide-y divide-border">
              {page.items.map((run) => <HistoryRow key={run.id} run={run} />)}
            </ol>
          </>
        )}
      </section>

      {page.nextCursor ? (
        <nav aria-label="History pagination" className="mt-5 flex justify-end">
          <Link
            href={`/history?cursor=${encodeURIComponent(page.nextCursor)}`}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border-strong bg-surface-raised px-4 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            Older runs
          </Link>
        </nav>
      ) : null}
    </div>
  );
}

function HistoryRow({ run }: { run: HistoryListItem }) {
  return (
    <li>
      <Link
        href={`/history/${encodeURIComponent(run.id)}`}
        className="group grid min-w-0 gap-3 px-4 py-4 transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40 sm:px-5 lg:grid-cols-[minmax(15rem,2fr)_6rem_7rem_7rem_9rem_1.5rem] lg:items-center lg:gap-4"
      >
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <MethodBadge method={run.method} />
            <p className="truncate text-sm font-semibold text-text-secondary">{run.endpointName}</p>
          </div>
          <p className="mt-1.5 truncate font-mono text-[11px] text-text-subtle" title={run.url}>{run.url}</p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-subtle lg:sr-only">Status</span>
          <RunStatus run={run} />
        </div>
        <HistoryMetric label="Duration" value={run.durationMs === null ? "—" : `${run.durationMs} ms`} />
        <HistoryMetric
          label="Tests"
          value={run.assertions.total === 0 ? "No tests" : `${run.assertions.passed}/${run.assertions.total} passed`}
          danger={run.assertions.failed > 0}
        />
        <time dateTime={run.createdAt} className="text-xs leading-5 text-text-muted">
          <span className="mr-2 font-semibold text-text-subtle lg:sr-only">Executed</span>
          {formatTimestamp(run.createdAt)}
        </time>
        <ChevronRightIcon className="hidden size-4 text-text-subtle transition-transform group-hover:translate-x-0.5 lg:block" />
      </Link>
    </li>
  );
}

function RunStatus({ run }: { run: HistoryListItem }) {
  if (run.statusCode !== null) {
    return <Badge tone={statusTone(run.statusCode)} className="font-mono">{run.statusCode}</Badge>;
  }
  return <Badge tone="danger" className="max-w-full truncate">{failureLabel(run.executionStatus)}</Badge>;
}

function HistoryMetric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <p className={`text-xs ${danger ? "text-danger-soft" : "text-text-muted"}`}>
      <span className="mr-2 font-semibold text-text-subtle lg:sr-only">{label}</span>
      {value}
    </p>
  );
}

export function failureLabel(status: HistoryListItem["executionStatus"]) {
  return {
    SUCCESS: "Success",
    HTTP_RESPONSE: "HTTP response",
    TIMEOUT: "Timed out",
    DNS_ERROR: "DNS error",
    CONNECTION_ERROR: "Connection error",
    TLS_ERROR: "TLS error",
    INVALID_REQUEST: "Invalid request",
    RESPONSE_TOO_LARGE: "Too large",
    BLOCKED_TARGET: "Blocked",
    INTERNAL_ERROR: "Failed",
  }[status];
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

export function formattedSize(value: number | null) {
  return value === null ? "—" : formatBytes(value);
}

