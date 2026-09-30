import { CollectionsView } from "@/components/collections/collections-view";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { listCollectionsForUser } from "@/lib/collections/repository";

export default async function CollectionsPage() {
  const user = await requireAuthenticatedUser();
  const collections = await listCollectionsForUser(user.id);

  return <CollectionsView collections={collections} />;
}
