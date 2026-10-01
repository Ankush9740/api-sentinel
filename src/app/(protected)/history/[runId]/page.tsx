import { notFound } from "next/navigation";

import { HistoryDetail } from "@/components/history/history-detail";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getHistoryRunForUser } from "@/lib/history/repository";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const [{ runId }, user] = await Promise.all([params, requireAuthenticatedUser()]);
  const run = await getHistoryRunForUser(user.id, runId);
  if (!run) notFound();

  return <HistoryDetail run={run} />;
}

