import { notFound } from "next/navigation";

import { CollectionDetailView } from "@/components/collections/collection-detail-view";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getCollectionForUser } from "@/lib/collections/repository";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const [{ collectionId }, user] = await Promise.all([params, requireAuthenticatedUser()]);
  const collection = await getCollectionForUser(user.id, collectionId);

  if (!collection) notFound();

  return <CollectionDetailView collection={collection} />;
}
