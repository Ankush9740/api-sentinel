"use client";

import { useMemo, useRef, useState } from "react";

import { BracketsIcon, CheckIcon, CloseIcon, CopyIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeedbackState } from "@/components/ui/feedback-state";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import type { ExecutionApiResult } from "@/lib/request-executor/types";
import {
  executionErrorPresentation,
  formatBytes,
  prepareResponseBody,
  statusTone,
} from "@/lib/response-inspector/presentation";

const responseTabs: TabItem[] = [
  { id: "body", label: "Body" },
  { id: "headers", label: "Headers" },
  { id: "tests", label: "Tests" },
];

interface ResponseInspectorProps {
  result: ExecutionApiResult | null;
  sending: boolean;
  selectedTab: string;
  onSelectTab: (tab: string) => void;
  onRetry: () => void;
}

export function ResponseInspector({
  result,
  sending,
  selectedTab,
  onSelectTab,
  onRetry,
}: ResponseInspectorProps) {
  return (
    <section
      aria-labelledby="response-title"
      className="@container/response mt-3.5 min-w-0 rounded-[22px] border border-border-strong bg-response p-4 shadow-[0_2px_8px_rgba(75,60,39,0.04)] sm:p-5"
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:gap-4">
        <h2 id="response-title" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-subtle">
          Response
        </h2>
        <ResponseStatus result={result} sending={sending} />
      </div>

      <div className="mt-3.5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3.5 @min-[60rem]/response:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface-raised">
          <Tabs
            items={responseTabs.map((tab) => ({
              ...tab,
              count: tab.id === "tests" && result?.ok ? result.assertions.total : undefined,
            }))}
            selectedId={selectedTab}
            onSelect={onSelectTab}
            label="Response views"
            className="px-4 sm:px-5"
          />
          <div role="tabpanel" aria-label={`${selectedTab} response`}>
            <ResponseContent
              result={result}
              sending={sending}
              selectedTab={selectedTab}
              onRetry={onRetry}
            />
          </div>
        </div>
        <ExecutionSummary result={result} sending={sending} />
      </div>
    </section>
  );
}

function ResponseStatus({ result, sending }: { result: ExecutionApiResult | null; sending: boolean }) {
  if (sending) {
    return (
      <span role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-text-subtle">
        <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-warning motion-reduce:animate-none" aria-hidden="true" />
        Sending request…
      </span>
    );
  }

  if (result?.ok) {
    return (
      <div role="status" aria-live="polite" className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 font-mono text-[11px]">
        <Badge tone={statusTone(result.response.status)} className="h-6 px-2 font-mono">
          {result.response.status} {result.response.statusText || "Response"}
        </Badge>
        <span className="rounded-full border border-border bg-surface-raised px-2 py-1 text-text-secondary">
          {result.response.durationMs} ms
        </span>
        <span className="rounded-full border border-border bg-surface-raised px-2 py-1 text-text-secondary">
          {formatBytes(result.response.sizeBytes)}
        </span>
      </div>
    );
  }

  const label = result
    ? executionErrorPresentation(result.error.code).title
    : "Waiting for request";

  return (
    <span role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-text-subtle">
      <span className={`size-1.5 shrink-0 rounded-full ${result ? "bg-danger" : "bg-text-subtle"}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function ResponseContent({
  result,
  sending,
  selectedTab,
  onRetry,
}: {
  result: ExecutionApiResult | null;
  sending: boolean;
  selectedTab: string;
  onRetry: () => void;
}) {
  const [copyState, setCopyState] = useState<{ id: string; label: string } | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preparedBody = useMemo(
    () => result?.ok
      ? prepareResponseBody(result.response.body, result.response.bodyKind)
      : { display: "", malformedJson: false },
    [result],
  );

  async function copy(value: string, id: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState({ id, label: "Copied" });
    } catch {
      setCopyState({ id, label: "Copy unavailable" });
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState(null), 1_800);
  }

  if (sending) {
    return <FeedbackState className="min-h-48" title="Sending request…" description="API Sentinel is validating and executing the request from the server." />;
  }
  if (!result) {
    return <FeedbackState className="min-h-48" icon={<BracketsIcon className="size-5" />} title="No response yet" description="Configure an HTTP request above and send it to inspect the real response." />;
  }
  if (!result.ok) {
    const presentation = executionErrorPresentation(result.error.code);
    if (selectedTab === "tests") {
      return (
        <FeedbackState
          className="min-h-48"
          title="Tests were not run"
          description={`No assertions ran because ${presentation.title.toLowerCase()}. Correct the request and retry.`}
        />
      );
    }
    return (
      <div role="alert" className="flex min-h-52 flex-col items-center justify-center px-6 py-9 text-center">
        <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-danger/30 bg-danger-muted text-danger-soft">
          <span className="font-mono text-sm font-semibold" aria-hidden="true">!</span>
        </div>
        <h3 className="text-sm font-semibold text-text">{presentation.title}</h3>
        <p className="mt-1.5 max-w-md text-sm leading-6 text-text-muted">
          {firstFieldError(result.error.fieldErrors) ?? result.error.message}
        </p>
        <p className="mt-1 max-w-md text-xs leading-5 text-text-subtle">{presentation.guidance}</p>
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-5">Retry</Button>
      </div>
    );
  }
  if (selectedTab === "tests") {
    if (result.assertions.total === 0) {
      return <FeedbackState className="min-h-48" title="No assertions configured" description="Add a response assertion above, then send the request to evaluate it on the server." />;
    }
    return <TestResults summary={result.assertions} />;
  }
  if (selectedTab === "headers") {
    if (!result.response.headers.length) {
      return <FeedbackState className="min-h-48" title="No response headers" description="The target returned no response headers." />;
    }

    return (
      <div className="min-w-0">
        <p className="border-b border-border bg-surface-subtle/45 px-4 py-2 text-[11px] text-text-subtle sm:px-5">
          {result.response.headers.length} {result.response.headers.length === 1 ? "header" : "headers"} received
        </p>
        <dl className="max-h-[32rem] min-w-0 divide-y divide-border overflow-y-auto px-4 py-1 text-xs sm:px-5">
          {result.response.headers.map((header, index) => {
            const copyId = `header-${index}`;
            return (
              <div key={`${header.key}-${index}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 py-3 @min-[34rem]/response:grid-cols-[10rem_minmax(0,1fr)_auto] @min-[34rem]/response:gap-4">
                <dt className="min-w-0 break-all font-mono font-semibold text-text-secondary">{header.key}</dt>
                <dd className="col-start-1 min-w-0 whitespace-pre-wrap break-words font-mono leading-5 text-text-muted [overflow-wrap:anywhere] @min-[34rem]/response:col-start-2">{header.value}</dd>
                <CopyButton
                  label={`Copy ${header.key} header value`}
                  copied={copyState?.id === copyId}
                  statusLabel={copyState?.id === copyId ? copyState.label : null}
                  onClick={() => copy(header.value, copyId)}
                  className="col-start-2 row-start-1 @min-[34rem]/response:col-start-3"
                />
              </div>
            );
          })}
        </dl>
      </div>
    );
  }

  if (result.response.bodyKind === "empty") {
    return <FeedbackState className="min-h-48" title="Empty response body" description="The target returned a valid HTTP response without body content." />;
  }
  if (result.response.bodyKind === "binary") {
    return (
      <FeedbackState
        className="min-h-48"
        title="Binary response not displayed"
        description={result.response.contentType
          ? `The target returned ${result.response.contentType}. API Sentinel preserved its metadata without rendering binary bytes as text.`
          : "The target returned non-textual content. API Sentinel preserved its metadata without rendering binary bytes as text."}
      />
    );
  }

  const bodyCopyId = "response-body";
  return (
    <div className="min-w-0">
      {preparedBody.malformedJson ? (
        <p className="border-b border-warning/25 bg-warning-muted/55 px-4 py-2 text-xs leading-5 text-warning-soft sm:px-5">
          This response was identified as JSON but could not be parsed. The original response text is shown below.
        </p>
      ) : null}
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border bg-surface-subtle/45 px-4 py-1.5 sm:px-5">
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-text-subtle">
          {preparedBody.malformedJson ? "Raw JSON response" : result.response.bodyKind === "json" ? "Formatted JSON" : "Plain text"}
        </span>
        <CopyButton
          label="Copy response body"
          copied={copyState?.id === bodyCopyId}
          statusLabel={copyState?.id === bodyCopyId ? copyState.label : null}
          onClick={() => copy(result.response.body, bodyCopyId)}
          showText
        />
      </div>
      <pre className="max-h-[36rem] max-w-full overflow-auto whitespace-pre p-4 font-mono text-[12px] leading-5 text-text sm:p-5"><code>{preparedBody.display}</code></pre>
    </div>
  );
}

function CopyButton({
  label,
  copied,
  statusLabel,
  onClick,
  showText = false,
  className,
}: {
  label: string;
  copied: boolean;
  statusLabel: string | null;
  onClick: () => void;
  showText?: boolean;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size={showText ? "sm" : "icon"}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`${showText ? "h-7 px-2" : "size-7"} ${className ?? ""}`}
    >
      {copied ? <CheckIcon className="size-3.5 text-success" /> : <CopyIcon className="size-3.5" />}
      {showText ? <span>{statusLabel ?? "Copy body"}</span> : null}
      {statusLabel ? <span className="sr-only" role="status" aria-live="polite">{statusLabel}</span> : null}
    </Button>
  );
}

function ExecutionSummary({ result, sending }: { result: ExecutionApiResult | null; sending: boolean }) {
  const rows: Array<[string, string]> = result?.ok
    ? [
        ["Status", `${result.response.status} ${result.response.statusText}`.trim()],
        ["Duration", `${result.response.durationMs} ms`],
        ["Size", formatBytes(result.response.sizeBytes)],
        ["Content type", result.response.contentType ?? "Not provided"],
        ["Body", bodyKindLabel(result.response.bodyKind)],
        ...(result.response.redirectCount > 0
          ? [
              ["Redirects", String(result.response.redirectCount)] as [string, string],
              ["Final URL", result.response.finalUrl] as [string, string],
            ]
          : []),
      ]
    : result
      ? [
          ["Result", result.error.code.replaceAll("_", " ")],
          ["HTTP response", "Not received"],
        ]
      : [
          ["Status", sending ? "Running" : "—"],
          ["Duration", "—"],
          ["Size", "—"],
        ];

  return (
    <aside aria-label="Execution summary" className="min-w-0 rounded-xl border border-metadata-border bg-metadata p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-metadata-text">Execution summary</p>
      <p className="mt-2 text-xs leading-5 text-text-muted">
        {result?.ok
          ? "Measured server-side through full response-body completion."
          : result
            ? "The execution ended before a target HTTP response was received."
            : "Status and performance metadata will appear after a request runs."}
      </p>
      <dl className="mt-4 divide-y divide-metadata-border/70 border-y border-metadata-border/70 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex min-w-0 items-start justify-between gap-4 py-2.5">
            <dt className="shrink-0 text-text-muted">{label}</dt>
            <dd className="min-w-0 break-words text-right font-mono text-text-subtle [overflow-wrap:anywhere]">{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function TestResults({ summary }: { summary: NonNullable<Extract<ExecutionApiResult, { ok: true }>["assertions"]> }) {
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-subtle/45 px-4 py-2.5 sm:px-5">
        <p className="text-xs font-semibold text-text-secondary">
          {summary.passed}/{summary.total} passed
        </p>
        <span className={`rounded-full px-2 py-1 font-mono text-[10px] ${summary.failed ? "bg-danger-muted text-danger-soft" : "bg-success-muted text-success-soft"}`}>
          {summary.failed ? `${summary.failed} failed` : "All passed"}
        </span>
      </div>
      <ol className="max-h-[36rem] min-w-0 divide-y divide-border overflow-y-auto">
        {summary.results.map((test) => (
          <li key={`${test.index}-${test.label}`} className="grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)] gap-2.5 px-4 py-3.5 sm:px-5">
            <span
              aria-label={test.passed ? "Passed" : "Failed"}
              className={`mt-0.5 flex size-6 items-center justify-center rounded-full border ${test.passed ? "border-success/30 bg-success-muted text-success-soft" : "border-danger/30 bg-danger-muted text-danger-soft"}`}
            >
              {test.passed ? <CheckIcon className="size-3.5" /> : <CloseIcon className="size-3.5" />}
            </span>
            <div className="min-w-0">
              <p className="break-words text-[13px] font-medium text-text-secondary [overflow-wrap:anywhere]">{test.label}</p>
              <p className={`mt-1 text-xs leading-5 ${test.passed ? "text-text-subtle" : "text-danger-soft"}`}>{test.message}</p>
              {!test.passed && (test.expected !== null || test.actual !== null) ? (
                <dl className="mt-2 grid min-w-0 gap-1 rounded-lg border border-border bg-surface-subtle/55 px-3 py-2 font-mono text-[11px] @min-[34rem]/response:grid-cols-2">
                  <div className="min-w-0"><dt className="text-text-subtle">Expected</dt><dd className="break-words text-text-secondary [overflow-wrap:anywhere]">{test.expected ?? "—"}</dd></div>
                  <div className="min-w-0"><dt className="text-text-subtle">Received</dt><dd className="break-words text-text-secondary [overflow-wrap:anywhere]">{test.actual ?? "—"}</dd></div>
                </dl>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function firstFieldError(fieldErrors?: Record<string, string[]>) {
  if (!fieldErrors) return null;
  for (const messages of Object.values(fieldErrors)) {
    if (messages?.[0]) return messages[0];
  }
  return null;
}

function bodyKindLabel(kind: "json" | "text" | "empty" | "binary") {
  const labels = {
    json: "JSON",
    text: "Text",
    empty: "Empty",
    binary: "Binary (not displayed)",
  };
  return labels[kind];
}
