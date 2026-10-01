import Link from "next/link";

import { HistoryIcon } from "@/components/icons";
import { FeedbackState } from "@/components/ui/feedback-state";

export default function HistoryRunNotFound() {
  return (
    <div className="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-[1680px] bg-workspace px-4 py-8 sm:px-7 lg:px-8">
      <section className="rounded-[22px] border border-border-strong bg-surface-raised">
        <FeedbackState
          icon={<HistoryIcon className="size-5" />}
          title="Execution not found"
          description="This run does not exist or is not available in your workspace."
          action={<Link href="/history" className="inline-flex h-10 items-center rounded-lg border border-accent bg-accent px-4 text-sm font-medium text-accent-contrast">Back to history</Link>}
        />
      </section>
    </div>
  );
}

