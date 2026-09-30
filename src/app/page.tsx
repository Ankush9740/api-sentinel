import { AppShell } from "@/components/app-shell";
import { RequestWorkspace } from "@/components/request-workspace";

export default function Home() {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-[1680px] flex-col">
        <header className="px-4 pb-4 pt-6 sm:px-7 lg:px-8 lg:pb-5 lg:pt-7">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">
            <span className="size-1.5 rounded-full bg-nav-accent ring-2 ring-accent-muted" aria-hidden="true" />
            HTTP client
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-text sm:text-[1.625rem]">
            Workspace
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-text-muted">
            Build a request, inspect its response, and validate behavior in one focused workspace.
          </p>
        </header>
        <RequestWorkspace />
      </div>
    </AppShell>
  );
}
