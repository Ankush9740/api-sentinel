"use client";

import { useState } from "react";

import { ArrowRightIcon, BracketsIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeedbackState } from "@/components/ui/feedback-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, type TabItem } from "@/components/ui/tabs";

const requestTabs: TabItem[] = [
  { id: "params", label: "Params" },
  { id: "headers", label: "Headers" },
  { id: "body", label: "Body" },
  { id: "assertions", label: "Assertions" },
];

const emptyConfiguration: Record<
  string,
  { title: string; description: string }
> = {
  params: {
    title: "No query parameters",
    description: "URL parameter controls will appear in this request configuration area.",
  },
  headers: {
    title: "No request headers",
    description: "Request header controls will appear in this configuration area.",
  },
  body: {
    title: "No request body",
    description: "A JSON request editor will appear here for supported methods.",
  },
  assertions: {
    title: "No assertions",
    description: "Response validation rules will appear in this configuration area.",
  },
};

export function RequestWorkspace() {
  const [activeTab, setActiveTab] = useState("params");
  const activeEmptyState = emptyConfiguration[activeTab];

  return (
    <div className="bg-workspace px-4 pb-7 pt-4 sm:px-7 sm:pt-5 lg:px-8 lg:pb-8">
      <section
        aria-labelledby="request-configuration-title"
        className="rounded-[22px] border border-border-strong bg-surface-raised p-4 shadow-[0_2px_8px_rgba(75,60,39,0.045)] sm:p-5"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-subtle">
              Request configuration
            </p>
            <h2
              id="request-configuration-title"
              className="mt-1 text-sm font-semibold text-text-secondary"
            >
              Untitled request
            </h2>
          </div>
          <Badge tone="neutral" className="h-5 px-2 font-mono text-[9px] uppercase tracking-[0.08em]">
            Unsaved
          </Badge>
        </div>

        <div
          className="mt-3.5 grid min-w-0 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-[0_1px_2px_rgba(72,58,39,0.04)] transition-colors duration-150 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 sm:grid-cols-[6.25rem_minmax(0,1fr)_6.75rem]"
          aria-describedby="request-execution-note"
        >
          <Select
            aria-label="HTTP method"
            defaultValue="GET"
            disabled
            className="h-11 rounded-none border-0 border-b border-border bg-method-get-muted px-3.5 font-mono text-xs font-bold text-method-get disabled:bg-method-get-muted disabled:text-method-get disabled:opacity-100 sm:border-b-0 sm:border-r"
          >
            <option>GET</option>
          </Select>
          <Input
            aria-label="Request URL"
            placeholder="https://api.example.com/users"
            disabled
            className="h-11 rounded-none border-0 bg-surface px-4 font-mono text-[13px] shadow-none disabled:bg-surface disabled:opacity-100"
          />
          <Button
            disabled
            className="h-11 rounded-none border-0 border-t border-nav-border bg-sidebar text-nav-text disabled:bg-sidebar disabled:text-nav-text disabled:opacity-70 sm:border-l sm:border-t-0"
          >
            Send
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>

        <div
          id="request-execution-note"
          className="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-warning/25 bg-warning-muted/60 px-2.5 py-1.5 text-xs text-warning-soft"
        >
          <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
          Request sending is currently unavailable.
        </div>

        <div className="mt-5">
          <Tabs
            items={requestTabs}
            selectedId={activeTab}
            onSelect={setActiveTab}
            label="Request configuration"
          />
          <div
            role="tabpanel"
            aria-label={`${activeEmptyState.title} configuration`}
            className="mt-3 flex min-h-28 items-center justify-center rounded-xl border border-border bg-surface-subtle/60 px-4 py-6 text-center sm:min-h-32"
          >
            <div className="max-w-sm">
              <p className="text-[13px] font-medium text-text-secondary">
                {activeEmptyState.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-text-muted">
                {activeEmptyState.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="response-title"
        className="mt-3.5 rounded-[22px] border border-border-strong bg-response p-4 shadow-[0_2px_8px_rgba(75,60,39,0.04)] sm:p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <h2
            id="response-title"
            className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-subtle"
          >
            Response
          </h2>
          <span className="flex items-center gap-2 text-xs text-text-subtle">
            <span className="size-1.5 rounded-full bg-text-subtle ring-2 ring-surface-subtle" aria-hidden="true" />
            Waiting for request
          </span>
        </div>

        <div className="mt-3.5 grid min-w-0 gap-3.5 xl:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface-raised">
            <div
              aria-label="Response views"
              className="flex gap-4 overflow-x-auto overflow-y-hidden border-b border-border px-4 text-xs font-medium [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:px-5"
            >
              <span className="-mb-px flex h-10 shrink-0 items-center border-b-2 border-accent px-0.5 text-text">
                Body
              </span>
              <span className="flex h-10 shrink-0 items-center text-text-subtle">Headers</span>
              <span className="flex h-10 shrink-0 items-center text-text-subtle">Tests</span>
            </div>

            <FeedbackState
              className="min-h-44 sm:min-h-48"
              icon={<BracketsIcon className="size-5" />}
              title="No response yet"
              description="Configure an API request above. Response body, headers, and assertions will appear here after a request runs."
            />
          </div>

          <aside
            aria-label="Execution summary"
            className="rounded-xl border border-metadata-border bg-metadata p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-metadata-text">
              Execution summary
            </p>
            <p className="mt-2 text-xs leading-5 text-text-muted">
              Status and performance metadata will appear after a request runs.
            </p>
            <dl className="mt-4 divide-y divide-metadata-border/70 border-y border-metadata-border/70 text-xs">
              {[
                ["Status", "—"],
                ["Duration", "—"],
                ["Size", "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-text-muted">{label}</dt>
                  <dd className="font-mono text-text-subtle">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>
    </div>
  );
}
