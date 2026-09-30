import type { HTMLAttributes } from "react";

import { cn } from "@/lib/classnames";

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  neutral: "border-border-strong bg-surface-subtle text-text-secondary",
  accent: "border-accent/30 bg-accent-muted text-accent-soft",
  success: "border-success/30 bg-success-muted text-success-soft",
  warning: "border-warning/30 bg-warning-muted text-warning-soft",
  danger: "border-danger/30 bg-danger-muted text-danger-soft",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
