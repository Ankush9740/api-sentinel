import { HistoryList } from "@/components/history/history-list";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { listHistoryForUser } from "@/lib/history/repository";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const [params, user] = await Promise.all([searchParams, requireAuthenticatedUser()]);
  const cursor = Array.isArray(params.cursor) ? params.cursor[0] : params.cursor;
  const page = await listHistoryForUser(user.id, cursor);

  return <HistoryList page={page} />;
}

