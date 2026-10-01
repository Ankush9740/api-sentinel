import { redirect } from "next/navigation";

import { GitHubIcon, GoogleIcon, ProductMarkIcon } from "@/components/icons";
import { signInWithGitHub, signInWithGoogle } from "@/lib/auth/actions";
import { getAuthenticatedUser } from "@/lib/auth/server";
import {
  getAuthEnvironmentStatus,
  getGoogleAuthEnvironmentStatus,
} from "@/lib/env/server";

interface SignInPageProps {
  searchParams: Promise<{
    notice?: string | string[];
  }>;
}

const notices: Record<string, string> = {
  configuration: "Authentication is not configured in this environment yet.",
  "google-configuration":
    "Google sign-in is not configured in this environment yet. You can still continue with GitHub.",
  "signin-required": "Sign in to continue to the protected workspace.",
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { notice: rawNotice } = await searchParams;
  const noticeKey = Array.isArray(rawNotice) ? rawNotice[0] : rawNotice;
  const requestedNotice =
    noticeKey && Object.hasOwn(notices, noticeKey) ? notices[noticeKey] : undefined;
  const environment = getAuthEnvironmentStatus();
  const googleEnvironment = getGoogleAuthEnvironmentStatus();
  let authenticationUnavailable = false;
  let authenticatedUser: Awaited<ReturnType<typeof getAuthenticatedUser>> = null;

  if (environment.isConfigured) {
    try {
      authenticatedUser = await getAuthenticatedUser();
    } catch {
      authenticationUnavailable = true;
    }
  }

  if (authenticatedUser) redirect("/workspace");

  const isUnavailable = !environment.isConfigured || authenticationUnavailable;
  const notice = authenticationUnavailable
    ? "Authentication is temporarily unavailable. Please try again shortly."
    : !environment.isConfigured
      ? notices.configuration
      : requestedNotice;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-canvas px-4 py-8 sm:px-6 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 14% 14%, rgba(239, 162, 193, 0.18), transparent 26rem), radial-gradient(circle at 86% 86%, rgba(222, 236, 217, 0.58), transparent 30rem)",
        }}
      />

      <section className="relative grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-border-strong bg-surface shadow-[0_24px_70px_rgba(63,49,33,0.15)] md:grid-cols-[0.92fr_1.08fr]">
        <div className="flex min-h-64 flex-col bg-sidebar p-7 text-nav-text sm:p-9 md:min-h-[520px] md:p-10">
          <div className="flex items-center gap-2.5">
            <ProductMarkIcon className="size-7 text-nav-accent" />
            <span className="text-xs font-semibold uppercase tracking-[0.1em]">
              API Sentinel
            </span>
          </div>

          <div className="my-auto py-12 md:py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-nav-accent">
              Focused API workspace
            </p>
            <h1 className="mt-4 max-w-sm text-3xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-4xl">
              Test, inspect, and validate APIs with clarity.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-nav-muted">
              One calm workspace for composing requests and understanding every response.
            </p>
          </div>

          <p className="text-xs leading-5 text-nav-subtle">
            Your workspace is private to your authenticated account.
          </p>
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-10 md:p-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            Welcome
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-text sm:text-3xl">
            Sign in to your workspace
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            Continue with GitHub or Google to establish your secure, database-backed API Sentinel identity.
          </p>

          {notice ? (
            <div
              role="status"
              className="mt-6 rounded-xl border border-warning/25 bg-warning-muted/55 px-4 py-3 text-sm leading-5 text-warning-soft"
            >
              {notice}
            </div>
          ) : null}

          <div className="mt-7 grid gap-3">
            <form action={signInWithGitHub}>
              <button
                type="submit"
                disabled={isUnavailable}
                className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-sidebar bg-sidebar px-4 text-sm font-semibold text-nav-text transition-colors hover:border-nav-raised hover:bg-nav-raised disabled:cursor-not-allowed disabled:opacity-50"
              >
                <GitHubIcon className="size-[18px]" />
                Continue with GitHub
              </button>
            </form>

            <form action={signInWithGoogle}>
              <button
                type="submit"
                disabled={isUnavailable}
                aria-describedby={!googleEnvironment.isConfigured ? "google-setup-note" : undefined}
                className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border-strong bg-surface px-4 text-sm font-semibold text-text transition-colors hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <GoogleIcon className="size-[18px]" />
                Continue with Google
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-text-subtle">
            OAuth providers are used only to authenticate your API Sentinel account.
          </p>
          {!googleEnvironment.isConfigured && !isUnavailable ? (
            <p id="google-setup-note" className="mt-2 text-center text-xs leading-5 text-text-subtle">
              Google sign-in needs local provider credentials before it can continue.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
