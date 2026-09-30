import type { ReactNode } from "react";

import { cn } from "@/lib/classnames";

type FeedbackTone = "empty" | "error";

interface FeedbackStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: FeedbackTone;
  className?: string;
}

export function FeedbackState({
  title,
  description,
  icon,
  action,
  tone = "empty",
  className,
}: FeedbackStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center",
        className,
      )}
      role={tone === "error" ? "alert" : undefined}
    >
      {icon ? (
        <div
          className={cn(
            "mb-4 flex size-10 items-center justify-center rounded-xl border",
            tone === "error"
              ? "border-danger/30 bg-danger-muted text-danger-soft"
              : "border-border-strong bg-surface-subtle text-text-secondary",
          )}
        >
          {icon}
        </div>
      ) : null}
      <h2 className="text-sm font-semibold text-text">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-text-muted">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 text-sm text-text-muted"
      role="status"
    >
      <span
        aria-hidden="true"
        className="size-3 animate-pulse rounded-full bg-accent motion-reduce:animate-none"
      />
      <span>{label}</span>
    </div>
  );
}
