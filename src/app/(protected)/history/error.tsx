"use client";

import { useEffect } from "react";

import { HistoryIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { FeedbackState } from "@/components/ui/feedback-state";

export default function HistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("The execution history interface failed to load.", error.name);
  }, [error]);

  return (
    <div className="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-[1680px] bg-workspace px-4 py-8 sm:px-7 lg:px-8">
      <section className="rounded-[22px] border border-border-strong bg-surface-raised">
        <FeedbackState
          tone="error"
          icon={<HistoryIcon className="size-5" />}
          title="We couldn't load execution history"
          description="Saved request runs are temporarily unavailable. Try again."
          action={<Button onClick={reset}>Try again</Button>}
        />
      </section>
    </div>
  );
}

