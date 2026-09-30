"use client";

import type { KeyboardEvent } from "react";

import { cn } from "@/lib/classnames";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  label: string;
  className?: string;
}

export function Tabs({
  items,
  selectedId,
  onSelect,
  label,
  className,
}: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex gap-4 overflow-x-auto overflow-y-hidden border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5",
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.id === selectedId;

        return (
          <button
            key={item.id}
            data-tab-id={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={item.disabled}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(item.id)}
            onKeyDown={(event) => handleTabKeyDown(event, item.id, onSelect)}
            className={cn(
              "-mb-px flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-0.5 text-xs font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40",
              selected
                ? "border-accent text-text"
                : "border-transparent text-text-muted hover:border-border-strong hover:text-text-secondary",
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className="font-mono text-[10px] text-text-muted">
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function handleTabKeyDown(
  event: KeyboardEvent<HTMLButtonElement>,
  currentId: string,
  onSelect: (id: string) => void,
) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    return;
  }

  const tabs = Array.from(
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]:not(:disabled)',
    ) ?? [],
  );
  const currentIndex = tabs.indexOf(event.currentTarget);
  if (currentIndex < 0 || tabs.length === 0) return;

  event.preventDefault();

  let nextIndex = currentIndex;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = tabs.length - 1;
  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
  if (event.key === "ArrowLeft") {
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  }

  const nextTab = tabs[nextIndex];
  nextTab.focus();
  onSelect(nextTab.dataset.tabId || currentId);
}
