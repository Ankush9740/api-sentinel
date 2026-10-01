import { LoadingState } from "@/components/ui/feedback-state";

export default function HistoryLoading() {
  return (
    <div className="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-[1680px] bg-workspace px-4 py-8 sm:px-7 lg:px-8">
      <LoadingState label="Loading execution history…" />
    </div>
  );
}

