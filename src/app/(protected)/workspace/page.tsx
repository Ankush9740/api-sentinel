import { notFound } from "next/navigation";

import { SavedRequestWorkspace } from "@/components/saved-request-workspace";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import {
  getEndpointForUser,
  listCollectionOptionsForUser,
} from "@/lib/collections/repository";

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ endpoint?: string | string[]; collection?: string | string[] }>;
}) {
  const [params, user] = await Promise.all([searchParams, requireAuthenticatedUser()]);
  const endpointId = Array.isArray(params.endpoint) ? params.endpoint[0] : params.endpoint;
  const preferredCollectionId = Array.isArray(params.collection)
    ? params.collection[0]
    : params.collection;
  const [collections, endpoint] = await Promise.all([
    listCollectionOptionsForUser(user.id),
    endpointId ? getEndpointForUser(user.id, endpointId) : Promise.resolve(null),
  ]);

  if (endpointId && !endpoint) notFound();

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-[1680px] flex-col">
      <header className="px-4 pb-4 pt-6 sm:px-7 lg:px-8 lg:pb-5 lg:pt-7">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">
          <span
            className="size-1.5 rounded-full bg-nav-accent ring-2 ring-accent-muted"
            aria-hidden="true"
          />
          HTTP client
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-text sm:text-[1.625rem]">
          Workspace
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-text-muted">
          Build a request, inspect its response, and validate behavior in one focused workspace.
        </p>
      </header>
      <SavedRequestWorkspace
        key={endpoint?.id ?? "new-request"}
        collections={collections}
        endpoint={endpoint}
        preferredCollectionId={preferredCollectionId ?? null}
      />
    </div>
  );
}
