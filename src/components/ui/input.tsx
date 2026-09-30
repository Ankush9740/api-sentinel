import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/classnames";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-10 min-w-0 rounded-lg border border-border-strong bg-surface px-3 text-sm text-text shadow-[inset_0_1px_1px_rgba(72,58,39,0.04)] transition-colors placeholder:text-text-muted hover:border-border-hover disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-muted disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
