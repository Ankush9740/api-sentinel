"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  BracketsIcon,
  CloseIcon,
  CollectionIcon,
  HistoryIcon,
  LogOutIcon,
  MenuIcon,
  PlusIcon,
  ProductMarkIcon,
  UserIcon,
} from "@/components/icons";
import { NewRequestButton } from "@/components/new-request-button";
import { Button } from "@/components/ui/button";
import { trapDialogFocus } from "@/components/ui/dialog";
import { signOutFromApp } from "@/lib/auth/actions";

interface AuthenticatedUserSummary {
  name: string | null;
  email: string | null;
  image: string | null;
}

interface AppShellProps {
  children: ReactNode;
  user: AuthenticatedUserSummary;
}

const navItems = [
  { label: "Workspace", href: "/workspace", icon: BracketsIcon },
  { label: "Collections", href: "/collections", icon: CollectionIcon },
  { label: "History", href: "/history", icon: HistoryIcon },
] as const;

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileDialogRef = useRef<HTMLDialogElement>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDetailsElement>(null);
  const accountSummaryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Keep modal state in sync with the xl (80rem) navigation breakpoint.
    const desktop = window.matchMedia("(min-width: 80rem)");
    const handleLayoutChange = () => {
      if (desktop.matches) {
        if (mobileDialogRef.current?.open) {
          mobileDialogRef.current.close();
          accountSummaryRef.current?.focus({ preventScroll: true });
        }
        setMobileNavOpen(false);
      } else if (accountMenuRef.current?.open) {
        accountMenuRef.current.open = false;
        accountMenuRef.current.parentElement
          ?.querySelector<HTMLButtonElement>('[aria-label="Open account and navigation"]')
          ?.focus({ preventScroll: true });
      }
    };

    desktop.addEventListener("change", handleLayoutChange);
    return () => desktop.removeEventListener("change", handleLayoutChange);
  }, []);

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

    if (dialog.open) {
      dialog.close();
      const trigger = drawerTriggerRef.current;
      if (trigger?.getClientRects().length) {
        trigger.focus({ preventScroll: true });
      } else {
        accountSummaryRef.current?.focus({ preventScroll: true });
      }
    }
  }, [mobileNavOpen]);

  return (
    <div className="min-h-dvh min-w-0 bg-canvas text-text">
      <a
        href="#workspace"
        className="fixed left-3 top-3 z-50 -translate-y-20 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast transition-transform focus:translate-y-0"
      >
        Skip to workspace
      </a>

      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-nav-border bg-sidebar xl:border-border xl:bg-chrome">
        <div className="flex h-full min-w-0 items-center">
          <div className="flex h-full min-w-0 flex-1 items-center border-r-0 border-nav-border bg-sidebar px-3 sm:flex-none xl:w-[188px] xl:shrink-0 xl:border-r xl:px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={(event) => {
                drawerTriggerRef.current = event.currentTarget;
                setMobileNavOpen(true);
              }}
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
              aria-controls="application-navigation"
              className="mr-1 !text-nav-text hover:!bg-nav-raised xl:hidden"
            >
              <MenuIcon className="size-[18px]" />
            </Button>
            <Brand />
          </div>

          <div className="flex h-full shrink-0 items-center gap-2 px-1 sm:px-3 xl:px-4">
            <NewRequestButton
              aria-label="New request"
              className="inline-flex size-8 shrink-0 items-center justify-center gap-2 rounded-lg border border-sidebar bg-sidebar p-0 text-xs font-medium text-nav-text transition-colors hover:border-nav-raised hover:bg-nav-raised sm:h-8 sm:w-auto sm:px-3"
            >
              <PlusIcon className="size-3.5" />
              <span className="hidden sm:inline">New request</span>
            </NewRequestButton>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 px-3 sm:gap-2 xl:px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={(event) => {
                drawerTriggerRef.current = event.currentTarget;
                setMobileNavOpen(true);
              }}
              aria-label="Open account and navigation"
              aria-expanded={mobileNavOpen}
              aria-controls="application-navigation"
              className="rounded-full !text-nav-text hover:!bg-nav-raised xl:hidden"
            >
              <AccountAvatar user={user} size="sm" />
            </Button>
            <details
              ref={accountMenuRef}
              onKeyDown={(event) => {
                if (event.key === "Escape" && event.currentTarget.open) {
                  event.preventDefault();
                  event.currentTarget.open = false;
                  accountSummaryRef.current?.focus();
                }
              }}
              className="group relative hidden shrink-0 xl:block"
            >
              <summary
                ref={accountSummaryRef}
                aria-label="Open account menu"
                className="flex size-8 cursor-pointer list-none items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-hover [&::-webkit-details-marker]:hidden"
              >
                <AccountAvatar user={user} size="sm" />
              </summary>
              <div className="absolute right-0 top-10 max-h-[calc(100dvh-4.5rem)] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface-raised p-3 shadow-[0_14px_35px_rgba(63,49,33,0.16)]">
                <AccountIdentity user={user} />
                <form action={signOutFromApp} className="mt-3 border-t border-border pt-2">
                  <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
                    <LogOutIcon className="size-4" />
                    Sign out
                  </Button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-14 z-30 hidden w-[188px] flex-col border-r border-nav-border bg-sidebar xl:flex">
        <SidebarContent user={user} pathname={pathname} />
      </aside>

      <dialog
        id="application-navigation"
        ref={mobileDialogRef}
        onCancel={(event) => {
          event.preventDefault();
          setMobileNavOpen(false);
        }}
        onClose={() => setMobileNavOpen(false)}
        onKeyDown={trapDialogFocus}
        aria-label="Application navigation"
        className="fixed inset-y-0 left-0 right-auto m-0 h-dvh w-[min(18rem,calc(100vw-3rem))] max-h-dvh max-w-none overflow-hidden border-0 border-r border-nav-border bg-sidebar p-0 text-nav-text shadow-2xl backdrop:bg-black/60 xl:hidden"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-nav-border px-4">
            <Brand />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              className="!text-nav-text hover:!bg-nav-raised"
            >
              <CloseIcon className="size-[18px]" />
            </Button>
          </div>
          <SidebarContent
            user={user}
            pathname={pathname}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </div>
      </dialog>

      <div className="min-w-0 pt-14 xl:pl-[188px]">
        <main id="workspace" className="min-w-0 min-h-[calc(100dvh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  user,
  pathname,
  onNavigate,
}: {
  user: AuthenticatedUserSummary;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-2.5 pb-3 pt-4">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-nav-subtle">
        Navigate
      </p>
      <nav aria-label="Primary navigation" className="mt-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/workspace" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={
                active
                  ? "relative flex h-10 items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-[13px] font-medium text-nav-text before:absolute before:-left-2.5 before:h-5 before:w-0.5 before:rounded-r before:bg-nav-accent"
                  : "flex h-10 items-center gap-2.5 rounded-lg border border-transparent px-3 text-[13px] text-nav-muted transition-colors hover:bg-nav-raised hover:text-nav-text"
              }
            >
              <Icon className={active ? "size-4 text-nav-accent" : "size-4"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-nav-border pt-3">
        <div className="flex min-w-0 items-center gap-2 rounded-xl px-2 py-2">
          <AccountAvatar user={user} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-nav-text">{getDisplayName(user)}</p>
            {user.email ? (
              <p className="mt-0.5 truncate text-[10px] text-nav-subtle">{user.email}</p>
            ) : null}
          </div>
          <form action={signOutFromApp}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-nav-muted transition-colors hover:bg-nav-raised hover:text-nav-text"
            >
              <LogOutIcon className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function AccountIdentity({ user }: { user: AuthenticatedUserSummary }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AccountAvatar user={user} size="md" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text">{getDisplayName(user)}</p>
        {user.email ? (
          <p className="mt-0.5 truncate text-xs text-text-subtle">{user.email}</p>
        ) : null}
      </div>
    </div>
  );
}

function AccountAvatar({
  user,
  size,
}: {
  user: AuthenticatedUserSummary;
  size: "sm" | "md";
}) {
  const dimension = size === "sm" ? 28 : 32;
  const className =
    size === "sm"
      ? "size-7 shrink-0 rounded-full border border-border-strong object-cover"
      : "size-8 shrink-0 rounded-full border border-white/15 object-cover";

  if (user.image) {
    return (
      <Image
        src={user.image}
        alt=""
        width={dimension}
        height={dimension}
        className={className}
      />
    );
  }

  const initial = getDisplayName(user).charAt(0).toUpperCase();

  return (
    <span
      aria-hidden="true"
      className={`${className} grid place-items-center bg-accent-muted text-[11px] font-semibold text-accent-soft`}
    >
      {initial || <UserIcon className="size-4" />}
    </span>
  );
}

function getDisplayName(user: AuthenticatedUserSummary) {
  return user.name?.trim() || user.email?.split("@")[0] || "Signed-in user";
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
