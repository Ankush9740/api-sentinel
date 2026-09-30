"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { ArrowRightIcon, CloseIcon, PlusIcon } from "@/components/icons";
import { ResponseInspector } from "@/components/response/response-inspector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FeedbackState } from "@/components/ui/feedback-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { createEndpointAction, updateEndpointAction } from "@/lib/collections/actions";
import type { CollectionOption, HttpMethodValue, SavedEndpoint } from "@/lib/collections/types";
import type { ExecutionFailure, ExecutionResult } from "@/lib/request-executor/types";
import { HTTP_METHODS } from "@/lib/validation/phase2";

const requestTabs: TabItem[] = [
  { id: "params", label: "Params" },
  { id: "headers", label: "Headers" },
  { id: "body", label: "Body" },
  { id: "assertions", label: "Assertions" },
];

interface EditableRow {
  clientId: string;
  key: string;
  value: string;
  enabled: boolean;
  sensitive?: boolean;
}

interface SavedRequestWorkspaceProps {
  collections: CollectionOption[];
  endpoint?: SavedEndpoint | null;
  preferredCollectionId?: string | null;
}

const methodClasses: Record<HttpMethodValue, string> = {
  GET: "bg-method-get-muted text-method-get",
  POST: "bg-method-post-muted text-method-post",
  PUT: "bg-method-put-muted text-method-put",
  PATCH: "bg-method-patch-muted text-method-patch",
  DELETE: "bg-method-delete-muted text-method-delete",
};

export function SavedRequestWorkspace({
  collections,
  endpoint = null,
  preferredCollectionId = null,
}: SavedRequestWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("params");
  const [method, setMethod] = useState<HttpMethodValue>(endpoint?.method ?? "GET");
  const [url, setUrl] = useState(endpoint?.url ?? "");
  const [body, setBody] = useState(endpoint?.body ?? "");
  const [queryParameters, setQueryParameters] = useState<EditableRow[]>(() => initialRows(endpoint?.queryParameters ?? [], "param"));
  const [headers, setHeaders] = useState<EditableRow[]>(() => initialRows(endpoint?.headers ?? [], "header"));
  const [endpointName, setEndpointName] = useState(endpoint?.name ?? "Untitled request");
  const initialCollectionId = endpoint?.collectionId ??
    (preferredCollectionId && collections.some((item) => item.id === preferredCollectionId)
      ? preferredCollectionId
      : collections[0]?.id ?? "");
  const [collectionId, setCollectionId] = useState(initialCollectionId);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState(endpoint?.name ?? "");
  const [draftCollectionId, setDraftCollectionId] = useState(initialCollectionId);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [responseTab, setResponseTab] = useState("body");
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentSnapshot = useMemo(
    () => JSON.stringify({ method, url, body, queryParameters: persistableRows(queryParameters), headers: persistableRows(headers) }),
    [body, headers, method, queryParameters, url],
  );
  const initialSnapshot = useMemo(
    () => JSON.stringify({
      method: endpoint?.method ?? "GET",
      url: endpoint?.url ?? "",
      body: endpoint?.body ?? "",
      queryParameters: persistableRows(initialRows(endpoint?.queryParameters ?? [], "param")),
      headers: persistableRows(initialRows(endpoint?.headers ?? [], "header")),
    }),
    [endpoint],
  );
  const dirty = !endpoint || currentSnapshot !== initialSnapshot;
  const bodyError = getJsonError(body);

  function openSaveDialog() {
    setDraftName(endpoint ? endpointName : draftName);
    setDraftCollectionId(collectionId || collections[0]?.id || "");
    setFeedback(null);
    setSaveDialogOpen(true);
  }

  function saveRequest() {
    const input = {
      name: draftName,
      collectionId: draftCollectionId,
      method,
      url,
      body,
      queryParameters: persistableRows(queryParameters).map(({ key, value, enabled }) => ({ key, value, enabled })),
      headers: persistableRows(headers).map(({ key, value, enabled, sensitive }) => ({ key, value, enabled, sensitive: sensitive ?? false })),
    };

    setFeedback(null);
    startTransition(async () => {
      const result = endpoint
        ? await updateEndpointAction({ id: endpoint.id, ...input })
        : await createEndpointAction(input);

      if (!result.ok) {
        setFeedback(firstValidationMessage(result.fieldErrors) ?? result.message);
        return;
      }

      setEndpointName(draftName.trim());
      setCollectionId(draftCollectionId);
      setSaveDialogOpen(false);
      setFeedback(result.message);
      router.replace(`/workspace?endpoint=${encodeURIComponent(result.data.id)}`);
      router.refresh();
    });
  }

  async function sendRequest() {
    if (isExecuting || bodyError) return;
    setIsExecuting(true);
    setExecutionResult(null);
    setResponseTab("body");

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method,
          url,
          body,
          queryParameters: persistableRows(queryParameters).map(({ key, value, enabled }) => ({ key, value, enabled })),
          headers: persistableRows(headers).map(({ key, value, enabled, sensitive }) => ({ key, value, enabled, sensitive: sensitive ?? false })),
        }),
      });
      const result = await response.json() as ExecutionResult;
      setExecutionResult(result);
    } catch {
      setExecutionResult(clientExecutionFailure(
        "API Sentinel could not reach its execution service. Try again.",
      ));
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <div className="min-w-0 bg-workspace px-4 pb-7 pt-4 sm:px-7 sm:pt-5 lg:px-8 lg:pb-8">
      {feedback && !saveDialogOpen ? (
        <p role="status" className="mb-3.5 rounded-xl border border-success/25 bg-success-muted px-4 py-3 text-sm text-success-soft">{feedback}</p>
      ) : null}

      <section aria-labelledby="request-configuration-title" className="@container/request min-w-0 rounded-[22px] border border-border-strong bg-surface-raised p-4 shadow-[0_2px_8px_rgba(75,60,39,0.045)] sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-subtle">Request configuration</p>
            <h2 id="request-configuration-title" className="mt-1 truncate text-sm font-semibold text-text-secondary">{endpointName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={endpoint && !dirty ? "success" : "neutral"} className="h-5 px-2 font-mono text-[9px] uppercase tracking-[0.08em]">
              {endpoint ? (dirty ? "Unsaved changes" : "Saved") : "Unsaved"}
            </Badge>
            <Button size="sm" onClick={openSaveDialog}>{endpoint ? "Save" : "Save request"}</Button>
          </div>
        </div>

        <div className="mt-3.5 grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl border border-border-strong bg-surface shadow-[0_1px_2px_rgba(72,58,39,0.04)] transition-colors duration-150 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 @min-[24rem]/request:grid-cols-[6.25rem_minmax(0,1fr)] @min-[42rem]/request:grid-cols-[6.25rem_minmax(0,1fr)_6.75rem]" aria-describedby="request-execution-note">
          <Select aria-label="HTTP method" value={method} onChange={(event) => setMethod(event.target.value as HttpMethodValue)} className={`h-11 min-w-0 rounded-none border-0 border-b border-border px-3.5 font-mono text-xs font-bold @min-[24rem]/request:border-b-0 @min-[24rem]/request:border-r ${methodClasses[method]}`}>
            {HTTP_METHODS.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Input aria-label="Request URL" placeholder="https://api.example.com/users" value={url} onChange={(event) => setUrl(event.target.value)} className="h-11 min-w-0 rounded-none border-0 bg-surface px-4 font-mono text-[13px] shadow-none" />
          <Button onClick={sendRequest} loading={isExecuting} disabled={Boolean(bodyError)} className="h-11 min-w-0 rounded-none border-0 border-t border-nav-border bg-sidebar text-nav-text disabled:bg-sidebar disabled:text-nav-text disabled:opacity-70 @min-[24rem]/request:col-span-2 @min-[42rem]/request:col-span-1 @min-[42rem]/request:border-l @min-[42rem]/request:border-t-0">
            {isExecuting ? "Sending…" : "Send"} {!isExecuting ? <ArrowRightIcon className="size-4" /> : null}
          </Button>
        </div>

        <div id="request-execution-note" className="mt-2.5 inline-flex max-w-full items-center gap-2 rounded-lg border border-warning/25 bg-warning-muted/60 px-2.5 py-1.5 text-xs text-warning-soft">
          <span className="size-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
          Requests run server-side. Private networks and credential-bearing headers remain blocked.
        </div>

        <div className="mt-5">
          <Tabs
            items={requestTabs.map((tab) => ({
              ...tab,
              count: tab.id === "params" ? persistableRows(queryParameters).length : tab.id === "headers" ? persistableRows(headers).length : undefined,
            }))}
            selectedId={activeTab}
            onSelect={setActiveTab}
            label="Request configuration"
          />
          <div role="tabpanel" aria-label={`${activeTab} configuration`} className="mt-3 min-h-28 rounded-xl border border-border bg-surface-subtle/60 p-3 sm:min-h-32 sm:p-4">
            {activeTab === "params" ? <RequestRows rows={queryParameters} setRows={setQueryParameters} kind="parameter" /> : null}
            {activeTab === "headers" ? (
              <div>
                <p className="mb-3 rounded-lg border border-warning/20 bg-warning-muted/50 px-3 py-2 text-xs leading-5 text-warning-soft">
                  Phase 2 saves non-sensitive headers only. Credential-bearing values remain blocked until encrypted storage is implemented.
                </p>
                <RequestRows rows={headers} setRows={setHeaders} kind="header" />
              </div>
            ) : null}
            {activeTab === "body" ? (
              <div>
                <label className="text-xs font-semibold text-text-secondary" htmlFor="request-json-body">JSON request body</label>
                <textarea
                  id="request-json-body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  spellCheck={false}
                  placeholder={'{\n  "example": true\n}'}
                  className="mt-2 min-h-44 w-full resize-y rounded-lg border border-border-strong bg-surface px-3 py-3 font-mono text-[13px] leading-6 text-text shadow-[inset_0_1px_1px_rgba(72,58,39,0.04)] placeholder:text-text-muted"
                  aria-describedby={bodyError ? "request-body-error" : "request-body-note"}
                  aria-invalid={Boolean(bodyError)}
                />
                {bodyError ? (
                  <p id="request-body-error" role="alert" className="mt-2 text-xs text-danger-soft">{bodyError}</p>
                ) : (
                  <p id="request-body-note" className="mt-2 text-xs leading-5 text-text-subtle">Saved JSON bodies are stored as entered. Do not include secrets that require encryption.</p>
                )}
              </div>
            ) : null}
            {activeTab === "assertions" ? (
              <FeedbackState className="min-h-24 py-5" title="Assertions arrive in Phase 5" description="Saved endpoint assertions are intentionally outside the Phase 2 scope." />
            ) : null}
          </div>
        </div>
      </section>

      <ResponseInspector
        result={executionResult}
        sending={isExecuting}
        selectedTab={responseTab}
        onSelectTab={setResponseTab}
        onRetry={sendRequest}
      />

      <Dialog
        open={saveDialogOpen}
        onClose={() => !isPending && setSaveDialogOpen(false)}
        title={endpoint ? "Save request changes" : "Save request"}
        description="Choose a clear name and the collection where this request belongs."
        footer={collections.length > 0 ? (
          <><Button variant="ghost" onClick={() => setSaveDialogOpen(false)} disabled={isPending}>Cancel</Button><Button onClick={saveRequest} loading={isPending} disabled={Boolean(bodyError)}>Save request</Button></>
        ) : <Button onClick={() => router.push("/collections")}>Create a collection</Button>}
      >
        {collections.length === 0 ? (
          <p className="text-sm leading-6 text-text-muted">Create a collection before saving your first request.</p>
        ) : (
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-text-secondary">Name<Input value={draftName} onChange={(event) => setDraftName(event.target.value)} required maxLength={100} autoFocus className="mt-1.5 w-full" /></label>
            <label className="block text-xs font-semibold text-text-secondary">Collection<Select value={draftCollectionId} onChange={(event) => setDraftCollectionId(event.target.value)} className="mt-1.5 w-full">{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</Select></label>
            {feedback ? <p role="alert" className="text-sm text-danger-soft">{feedback}</p> : null}
          </div>
        )}
      </Dialog>
    </div>
  );
}

function RequestRows({ rows, setRows, kind }: { rows: EditableRow[]; setRows: (rows: EditableRow[]) => void; kind: "parameter" | "header" }) {
  function updateRow(clientId: string, patch: Partial<EditableRow>) {
    setRows(rows.map((row) => (row.clientId === clientId ? { ...row, ...patch } : row)));
  }

  return (
    <div>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={row.clientId} className="grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)_2rem] gap-2 rounded-lg border border-border bg-surface p-2 sm:grid-cols-[1.75rem_minmax(0,0.9fr)_minmax(0,1.1fr)_2rem]">
            <label className="flex items-center justify-center self-center"><span className="sr-only">Enable {kind} {index + 1}</span><input type="checkbox" checked={row.enabled} onChange={(event) => updateRow(row.clientId, { enabled: event.target.checked })} className="size-4 accent-accent" /></label>
            <Input aria-label={`${kind} ${index + 1} key`} value={row.key} onChange={(event) => updateRow(row.clientId, { key: event.target.value })} placeholder={kind === "header" ? "Header name" : "Key"} className="h-9" />
            <Input aria-label={`${kind} ${index + 1} value`} value={row.value} onChange={(event) => updateRow(row.clientId, { value: event.target.value })} placeholder="Value" className="col-span-2 h-9 font-mono text-xs sm:col-span-1" />
            <Button variant="ghost" size="icon" onClick={() => setRows(rows.filter((item) => item.clientId !== row.clientId))} aria-label={`Remove ${kind} ${index + 1}`} className="row-start-1 size-8 text-text-subtle hover:text-danger-soft sm:row-start-auto"><CloseIcon className="size-4" /></Button>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={() => setRows([...rows, emptyRow(kind)])} className="mt-3"><PlusIcon className="size-4" />Add {kind}</Button>
    </div>
  );
}

function initialRows(rows: Array<{ id: string; key: string; value: string; enabled: boolean; sensitive?: boolean }>, prefix: string): EditableRow[] {
  return rows.map((row, index) => ({ clientId: row.id || `${prefix}-${index}`, key: row.key, value: row.value, enabled: row.enabled, sensitive: row.sensitive }));
}

function emptyRow(kind: string): EditableRow {
  return { clientId: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2)}`, key: "", value: "", enabled: true, sensitive: false };
}

function persistableRows(rows: EditableRow[]) {
  return rows
    .filter((row) => row.key.trim() || row.value)
    .map((row) => ({
      key: row.key,
      value: row.value,
      enabled: row.enabled,
      sensitive: row.sensitive,
    }));
}

function getJsonError(body: string) {
  if (!body.trim()) return null;
  try { JSON.parse(body); return null; } catch { return "Invalid JSON. Correct the request body before saving."; }
}

function firstValidationMessage(fieldErrors?: Record<string, string[]>) {
  if (!fieldErrors) return null;
  for (const messages of Object.values(fieldErrors)) if (messages?.[0]) return messages[0];
  return null;
}

function clientExecutionFailure(message: string): ExecutionFailure {
  return { ok: false, error: { code: "INTERNAL_ERROR", message } };
}

