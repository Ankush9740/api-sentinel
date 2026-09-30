"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import {
  ArrowLeftIcon,
  BracketsIcon,
  ChevronRightIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";
import { MethodBadge } from "@/components/collections/method-badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FeedbackState } from "@/components/ui/feedback-state";
import { Input } from "@/components/ui/input";
import {
  deleteCollectionAction,
  deleteEndpointAction,
  updateCollectionAction,
} from "@/lib/collections/actions";
import type { CollectionDetail, EndpointSummary } from "@/lib/collections/types";

type DialogState =
  | { kind: "closed" }
  | { kind: "edit-collection" }
  | { kind: "delete-collection" }
  | { kind: "delete-endpoint"; endpoint: EndpointSummary };

export function CollectionDetailView({ collection }: { collection: CollectionDetail }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>({ kind: "closed" });
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeDialog() {
    if (!isPending) setDialog({ kind: "closed" });
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await updateCollectionAction({ id: collection.id, name, description });
      if (!result.ok) {
        setFeedback(result.message);
        return;
      }
      setDialog({ kind: "closed" });
      setFeedback(result.message);
      router.refresh();
    });
  }

  function confirmCollectionDelete() {
    setFeedback(null);
    startTransition(async () => {
      const result = await deleteCollectionAction({ id: collection.id });
      if (!result.ok) {
        setFeedback(result.message);
        return;
      }
      router.push("/collections");
      router.refresh();
    });
  }

  function confirmEndpointDelete() {
    if (dialog.kind !== "delete-endpoint") return;
    setFeedback(null);
    startTransition(async () => {
      const result = await deleteEndpointAction({ id: dialog.endpoint.id });
      if (!result.ok) {
        setFeedback(result.message);
        return;
      }
      setDialog({ kind: "closed" });
      setFeedback(result.message);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-[1680px] flex-col bg-workspace">
      <header className="border-b border-border bg-canvas px-4 pb-5 pt-6 sm:px-7 lg:px-8 lg:pt-7">
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 rounded-md text-xs font-medium text-text-muted hover:text-text"
        >
          <ArrowLeftIcon className="size-4" />
          Collections
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold tracking-[-0.035em] text-text sm:text-[1.625rem]">
              {collection.name}
            </h1>
            <p className="mt-1 max-w-2xl break-words text-sm leading-5 text-text-muted">
              {collection.description || "Saved API endpoints in this collection."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setName(collection.name);
                setDescription(collection.description ?? "");
                setFeedback(null);
                setDialog({ kind: "edit-collection" });
              }}
            >
              <EditIcon className="size-4" />
              Edit
            </Button>
            <Link
              href={`/workspace?collection=${encodeURIComponent(collection.id)}`}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-accent bg-accent px-4 text-sm font-medium text-accent-contrast transition-colors hover:border-accent-strong hover:bg-accent-strong"
            >
              <PlusIcon className="size-4" />
              New endpoint
            </Link>
          </div>
        </div>
      </header>

      <div className="min-w-0 flex-1 px-4 py-5 sm:px-7 lg:px-8 lg:py-7">
        {feedback && dialog.kind === "closed" ? (
          <p role="status" className="mb-4 rounded-xl border border-success/25 bg-success-muted px-4 py-3 text-sm text-success-soft">
            {feedback}
          </p>
        ) : null}

        {collection.endpoints.length === 0 ? (
          <section className="rounded-[22px] border border-border-strong bg-surface-raised shadow-[0_2px_8px_rgba(75,60,39,0.045)]">
            <FeedbackState
              icon={<BracketsIcon className="size-5" />}
              title="No saved endpoints"
              description="Configure a request and save it here so you can return to it later."
              action={
                <Link
                  href={`/workspace?collection=${encodeURIComponent(collection.id)}`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-accent bg-accent px-4 text-sm font-medium text-accent-contrast hover:bg-accent-strong"
                >
                  <PlusIcon className="size-4" />
                  Create endpoint
                </Link>
              }
            />
          </section>
        ) : (
          <section className="overflow-hidden rounded-[20px] border border-border-strong bg-surface-raised shadow-[0_2px_8px_rgba(75,60,39,0.045)]" aria-label="Saved endpoints">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">Endpoints</p>
              <span className="font-mono text-[11px] text-text-subtle">{collection.endpointCount}</span>
            </div>
            <ul className="divide-y divide-border">
              {collection.endpoints.map((endpoint) => (
                <li key={endpoint.id} className="flex min-w-0 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-hover/60 sm:px-5">
                  <Link href={`/workspace?endpoint=${encodeURIComponent(endpoint.id)}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg">
                    <MethodBadge method={endpoint.method} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text">{endpoint.name}</span>
                      <span className="mt-1 block truncate font-mono text-[11px] text-text-muted">{endpoint.url}</span>
                    </span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFeedback(null);
                      setDialog({ kind: "delete-endpoint", endpoint });
                    }}
                    aria-label={`Delete ${endpoint.name}`}
                    className="text-danger-soft hover:bg-danger-muted hover:text-danger-soft"
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                  <ChevronRightIcon className="size-4 shrink-0 text-text-subtle" />
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-5 border-t border-border pt-5">
          <Button
            variant="ghost"
            onClick={() => {
              setFeedback(null);
              setDialog({ kind: "delete-collection" });
            }}
            className="text-danger-soft hover:bg-danger-muted hover:text-danger-soft"
          >
            <TrashIcon className="size-4" />
            Delete collection
          </Button>
        </div>
      </div>

      <Dialog
        open={dialog.kind === "edit-collection"}
        onClose={closeDialog}
        title="Edit collection"
        description="Update the collection name or description."
        footer={
          <>
            <Button variant="ghost" onClick={closeDialog} disabled={isPending}>Cancel</Button>
            <Button type="submit" form="edit-collection-form" loading={isPending}>Save changes</Button>
          </>
        }
      >
        <form id="edit-collection-form" onSubmit={submitEdit} className="space-y-4">
          <label className="block text-xs font-semibold text-text-secondary">
            Name
            <Input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} autoFocus className="mt-1.5 w-full" />
          </label>
          <label className="block text-xs font-semibold text-text-secondary">
            Description <span className="font-normal text-text-subtle">(optional)</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={4} className="mt-1.5 w-full resize-y rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm leading-5 text-text" />
          </label>
          {feedback ? <p role="alert" className="text-sm text-danger-soft">{feedback}</p> : null}
        </form>
      </Dialog>

      <Dialog
        open={dialog.kind === "delete-endpoint"}
        onClose={closeDialog}
        title={dialog.kind === "delete-endpoint" ? `Delete ${dialog.endpoint.name}?` : "Delete endpoint?"}
        description="This saved request configuration will be permanently removed."
        footer={
          <>
            <Button variant="ghost" onClick={closeDialog} disabled={isPending}>Cancel</Button>
            <Button variant="danger" onClick={confirmEndpointDelete} loading={isPending}>Delete endpoint</Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-text-muted">This action cannot be undone.</p>
        {feedback ? <p role="alert" className="mt-3 text-sm text-danger-soft">{feedback}</p> : null}
      </Dialog>

      <Dialog
        open={dialog.kind === "delete-collection"}
        onClose={closeDialog}
        title={`Delete ${collection.name}?`}
        description={`This will permanently remove the collection and its ${collection.endpointCount} saved ${collection.endpointCount === 1 ? "endpoint" : "endpoints"}.`}
        footer={
          <>
            <Button variant="ghost" onClick={closeDialog} disabled={isPending}>Cancel</Button>
            <Button variant="danger" onClick={confirmCollectionDelete} loading={isPending}>Delete collection</Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-text-muted">This action cannot be undone.</p>
        {feedback ? <p role="alert" className="mt-3 text-sm text-danger-soft">{feedback}</p> : null}
      </Dialog>
    </div>
  );
}
