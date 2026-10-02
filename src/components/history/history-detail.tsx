import Link from "next/link";

import { ArrowLeftIcon, CheckIcon, CloseIcon } from "@/components/icons";
import { MethodBadge } from "@/components/collections/method-badge";
import { LocalTimestamp } from "@/components/history/local-timestamp";
import { Badge } from "@/components/ui/badge";
import type { HistoryDetail as HistoryDetailData } from "@/lib/history/types";
import { prepareResponseBody, statusTone } from "@/lib/response-inspector/presentation";
import { failureLabel, formattedSize } from "./history-list";

export function HistoryDetail({ run }: { run: HistoryDetailData }) {
  const preparedBody = run.responseBody !== null && run.responseBodyKind
    ? prepareResponseBody(run.responseBody, run.responseBodyKind)
    : null;

  return (
    <div className="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-[1680px] bg-workspace px-4 py-7 sm:px-7 sm:py-8 lg:px-8">
      <Link href="/history" className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
        <ArrowLeftIcon className="size-4" /> Back to history
      </Link>

      <header className="mt-5 min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge tone="accent" className="uppercase tracking-[0.08em]">Past execution</Badge>
          <time dateTime={run.createdAt} className="text-xs text-text-subtle"><LocalTimestamp value={run.createdAt} /></time>
        </div>
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-3">
          <MethodBadge method={run.method} />
          <h1 className="min-w-0 break-words text-2xl font-semibold tracking-[-0.025em] text-text [overflow-wrap:anywhere]">{run.endpointName}</h1>
        </div>
        <p className="mt-2 break-all font-mono text-xs leading-5 text-text-muted">{run.url}</p>
        {run.endpointId ? (
          <Link href={`/workspace?endpoint=${encodeURIComponent(run.endpointId)}`} className="mt-3 inline-flex text-xs font-semibold text-accent-soft underline decoration-accent/35 underline-offset-4">
            Open current saved request
          </Link>
        ) : (
          <p className="mt-3 text-xs text-text-subtle">The original saved request has been deleted. This historical snapshot remains read-only.</p>
        )}
      </header>

      <div className="mt-6 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-4">
          {run.statusCode === null ? (
            <section aria-labelledby="history-failure-title" className="rounded-[22px] border border-danger/25 bg-danger-muted/35 p-5">
              <Badge tone="danger">{failureLabel(run.executionStatus)}</Badge>
              <h2 id="history-failure-title" className="mt-3 text-sm font-semibold text-text">No target HTTP response was received</h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-text-muted">{run.errorMessage ?? "The request ended before a response snapshot could be captured."}</p>
            </section>
          ) : (
            <section aria-labelledby="history-response-title" className="min-w-0 overflow-hidden rounded-[22px] border border-border-strong bg-surface-raised shadow-[0_2px_8px_rgba(75,60,39,0.045)]">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">Response snapshot</p>
                  <h2 id="history-response-title" className="mt-1 text-sm font-semibold text-text-secondary">Body at execution time</h2>
                </div>
                <Badge tone={statusTone(run.statusCode)} className="font-mono">{run.statusCode} {run.statusText || "Response"}</Badge>
              </div>
              {run.responseBodyTruncated ? (
                <p className="border-b border-warning/25 bg-warning-muted/55 px-4 py-2 text-xs leading-5 text-warning-soft sm:px-5">
                  This stored response body was truncated at the 256 KB history limit.
                </p>
              ) : null}
              <ResponseSnapshot run={run} preparedBody={preparedBody} />
              <p className="border-t border-border bg-surface-subtle/45 px-4 py-2 text-[11px] leading-5 text-text-subtle sm:px-5">
                Response headers are intentionally not retained in execution history.
              </p>
            </section>
          )}

          <AssertionSnapshot run={run} />
        </div>

        <aside aria-label="Historical execution summary" className="h-fit min-w-0 rounded-[22px] border border-metadata-border bg-metadata p-4 xl:sticky xl:top-[4.5rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-metadata-text">Execution summary</p>
          <p className="mt-2 text-xs leading-5 text-text-muted">Immutable metadata captured when this saved request ran.</p>
          <dl className="mt-4 divide-y divide-metadata-border/70 border-y border-metadata-border/70 text-xs">
            <SummaryRow label="Result" value={run.statusCode === null ? failureLabel(run.executionStatus) : `${run.statusCode} ${run.statusText ?? ""}`.trim()} />
            <SummaryRow label="Duration" value={run.durationMs === null ? "—" : `${run.durationMs} ms`} />
            <SummaryRow label="Size" value={formattedSize(run.responseSizeBytes)} />
            <SummaryRow label="Content type" value={run.responseContentType ?? "—"} />
            <SummaryRow label="Assertions" value={run.assertions.total ? `${run.assertions.passed}/${run.assertions.total} passed` : "No tests"} />
            {run.redirectCount ? <SummaryRow label="Redirects" value={String(run.redirectCount)} /> : null}
            {run.finalUrl && run.finalUrl !== run.url ? <SummaryRow label="Final URL" value={run.finalUrl} /> : null}
          </dl>
        </aside>
      </div>
    </div>
  );
}

function ResponseSnapshot({
  run,
  preparedBody,
}: {
  run: HistoryDetailData;
  preparedBody: { display: string; malformedJson: boolean } | null;
}) {
  if (run.responseBodyKind === "binary") {
    return <SnapshotMessage title="Binary body not retained" description="Metadata was saved without storing non-textual response bytes." />;
  }
  if (run.responseBodyKind === "empty" || run.responseBody === "") {
    return <SnapshotMessage title="Empty response body" description="The target returned a response without body content." />;
  }
  if (!preparedBody) {
    return <SnapshotMessage title="No response snapshot" description="A response body was not retained for this execution." />;
  }
  return (
    <div className="min-w-0">
      {preparedBody.malformedJson ? <p className="border-b border-warning/25 bg-warning-muted/55 px-4 py-2 text-xs text-warning-soft sm:px-5">The stored body was marked as JSON but could not be formatted.</p> : null}
      <pre className="max-h-[38rem] max-w-full overflow-auto whitespace-pre p-4 font-mono text-[12px] leading-5 text-text sm:p-5"><code>{preparedBody.display}</code></pre>
    </div>
  );
}

function SnapshotMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-text-muted">{description}</p>
    </div>
  );
}

function AssertionSnapshot({ run }: { run: HistoryDetailData }) {
  return (
    <section aria-labelledby="history-tests-title" className="min-w-0 overflow-hidden rounded-[22px] border border-border-strong bg-surface-raised shadow-[0_2px_8px_rgba(75,60,39,0.045)]">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">Tests snapshot</p>
          <h2 id="history-tests-title" className="mt-1 text-sm font-semibold text-text-secondary">Assertion results at execution time</h2>
        </div>
        {run.assertions.total ? <Badge tone={run.assertions.failed ? "danger" : "success"}>{run.assertions.passed}/{run.assertions.total} passed</Badge> : null}
      </div>
      {run.assertionResults.length === 0 ? (
        <SnapshotMessage title="No assertions ran" description="This execution did not have enabled response assertions." />
      ) : (
        <ol className="divide-y divide-border">
          {run.assertionResults.map((result) => (
            <li key={result.id} className="grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)] gap-2.5 px-4 py-3.5 sm:px-5">
              <span aria-label={result.passed ? "Passed" : "Failed"} className={`mt-0.5 flex size-6 items-center justify-center rounded-full border ${result.passed ? "border-success/30 bg-success-muted text-success-soft" : "border-danger/30 bg-danger-muted text-danger-soft"}`}>
                {result.passed ? <CheckIcon className="size-3.5" /> : <CloseIcon className="size-3.5" />}
              </span>
              <div className="min-w-0">
                <p className="break-words text-[13px] font-medium text-text-secondary [overflow-wrap:anywhere]">{result.label ?? `${result.type.replaceAll("_", " ")} assertion`}</p>
                {result.message ? <p className={`mt-1 text-xs leading-5 ${result.passed ? "text-text-subtle" : "text-danger-soft"}`}>{result.message}</p> : null}
                {!result.passed && (result.expected !== null || result.actual !== null) ? (
                  <dl className="mt-2 grid min-w-0 gap-1 rounded-lg border border-border bg-surface-subtle/55 px-3 py-2 font-mono text-[11px] sm:grid-cols-2">
                    <div className="min-w-0"><dt className="text-text-subtle">Expected</dt><dd className="break-words text-text-secondary [overflow-wrap:anywhere]">{result.expected ?? "—"}</dd></div>
                    <div className="min-w-0"><dt className="text-text-subtle">Received</dt><dd className="break-words text-text-secondary [overflow-wrap:anywhere]">{result.actual ?? "—"}</dd></div>
                  </dl>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right font-mono text-text-subtle [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

