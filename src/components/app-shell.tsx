"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  BracketsIcon,
  CloseIcon,
  CollectionIcon,
  HistoryIcon,
  MenuIcon,
  PlusIcon,
  ProductMarkIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  children: ReactNode;
}

const futureNavItems = [
  { label: "Collections", icon: CollectionIcon },
  { label: "History", icon: HistoryIcon },
];

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = mobileDialogRef.current;
    if (!dialog) return;

    if (mobileNavOpen) {
      if (!dialog.open) dialog.showModal();

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    if (dialog.open) dialog.close();
  }, [mobileNavOpen]);

  return (
    <div className="min-h-dvh bg-canvas text-text">
      <a
        href="#workspace"
        className="fixed left-3 top-3 z-50 -translate-y-20 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast transition-transform focus:translate-y-0"
      >
        Skip to workspace
      </a>

      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-nav-border bg-sidebar lg:border-border lg:bg-chrome">
        <div className="flex h-full items-center">
          <div className="flex h-full items-center border-r-0 border-nav-border bg-sidebar px-3 lg:w-[188px] lg:border-r lg:px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
              className="mr-1 px-2 !text-nav-text hover:!bg-nav-raised lg:hidden"
            >
              <MenuIcon className="size-[18px]" />
            </Button>
            <Brand />
          </div>

          <div className="hidden h-full items-center gap-2 px-3 sm:flex lg:px-4">
            <Button
              size="sm"
              disabled
              className="border-sidebar bg-sidebar text-nav-text hover:border-nav-raised hover:bg-nav-raised disabled:opacity-65"
              title="New request is currently unavailable"
            >
              <PlusIcon className="size-3.5" />
              New request
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-1.5 px-3 sm:gap-2 lg:px-4">
            <div className="hidden md:block">
              <Button
                variant="ghost"
                size="sm"
                disabled
                aria-label="Search is currently unavailable"
                className="min-w-40 justify-between border border-border bg-surface/70 px-2.5 text-text-muted disabled:opacity-70"
              >
                <span className="inline-flex items-center gap-2">
                  <SearchIcon className="size-3.5" />
                  Search
                </span>
                <kbd className="font-mono text-[10px] text-text-subtle">Ctrl K</kbd>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled
              aria-label="Account becomes available after sign-in"
              title="Account becomes available after sign-in"
              className="size-8 rounded-full px-0 !text-nav-text hover:!bg-nav-raised disabled:opacity-70 lg:!text-text-secondary lg:hover:!bg-surface-hover"
            >
              <UserIcon className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-14 z-30 hidden w-[188px] border-r border-nav-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      <dialog
        ref={mobileDialogRef}
        onCancel={(event) => {
          event.preventDefault();
          setMobileNavOpen(false);
        }}
        onClose={() => setMobileNavOpen(false)}
        aria-label="Application navigation"
        className="fixed inset-y-0 left-0 right-auto m-0 h-dvh w-[min(18rem,calc(100vw-3rem))] max-h-none max-w-none overflow-hidden border-0 border-r border-nav-border bg-sidebar p-0 text-nav-text shadow-2xl backdrop:bg-black/60 lg:hidden"
      >
        <div className="flex h-14 items-center justify-between border-b border-nav-border px-4">
          <Brand />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
            className="px-2 !text-nav-text hover:!bg-nav-raised"
          >
            <CloseIcon className="size-[18px]" />
          </Button>
        </div>
        <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
      </dialog>

      <div className="min-w-0 pt-14 lg:pl-[188px]">
        <main id="workspace" className="min-w-0 min-h-[calc(100dvh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col px-2.5 pb-3 pt-4">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-nav-subtle">
        Navigate
      </p>
      <nav aria-label="Primary navigation" className="mt-2 space-y-1">
        <a
          href="#workspace"
          aria-current="page"
          onClick={onNavigate}
          className="relative flex h-10 items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-[13px] font-medium text-nav-text before:absolute before:-left-2.5 before:h-5 before:w-0.5 before:rounded-r before:bg-nav-accent"
        >
          <BracketsIcon className="size-4 text-nav-accent" />
          Workspace
        </a>

        {futureNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              aria-disabled="true"
              title={`${item.label} is currently unavailable`}
              className="flex h-10 cursor-not-allowed items-center gap-2.5 rounded-lg px-3 text-[13px] text-nav-subtle"
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

    </div>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ProductMarkIcon className="size-[22px] shrink-0 text-nav-accent" />
      <span className="truncate text-[12px] font-semibold uppercase tracking-[0.085em] text-nav-text">
        API Sentinel
      </span>
    </div>
  );
}
