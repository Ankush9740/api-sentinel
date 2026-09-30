import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/classnames";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-10 rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium text-text transition-colors hover:border-border-hover disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-muted disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
