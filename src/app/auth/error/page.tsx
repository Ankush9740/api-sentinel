import Link from "next/link";

import { ProductMarkIcon } from "@/components/icons";

interface AuthErrorPageProps {
  searchParams: Promise<{
    error?: string | string[];
  }>;
}

const errorMessages: Record<string, string> = {
  AccessDenied: "GitHub sign-in was cancelled or access was denied.",
  OAuthAccountNotLinked:
    "This email is already associated with a different sign-in method.",
  SessionUnavailable:
    "Your session could not be verified because authentication is temporarily unavailable.",
  SignOutError: "Your sign-out request could not be completed. Please try again.",
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error: rawError } = await searchParams;
  const errorCode = Array.isArray(rawError) ? rawError[0] : rawError;
  const message =
    errorCode && Object.hasOwn(errorMessages, errorCode)
      ? errorMessages[errorCode]
      : undefined;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <section className="w-full max-w-md rounded-[24px] border border-border-strong bg-surface p-7 shadow-[0_20px_60px_rgba(63,49,33,0.13)] sm:p-9">
        <div className="flex items-center gap-2.5 text-text">
          <span className="grid size-9 place-items-center rounded-xl bg-sidebar text-nav-accent">
            <ProductMarkIcon className="size-5" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.1em]">
            API Sentinel
          </span>
        </div>
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.15em] text-danger">
          Authentication issue
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-text">
          We couldn&apos;t complete that request.
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          {message ?? "GitHub authentication could not be completed. Please return and try again."}
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-10 items-center justify-center rounded-xl border border-sidebar bg-sidebar px-4 text-sm font-semibold text-nav-text transition-colors hover:bg-nav-raised"
        >
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
