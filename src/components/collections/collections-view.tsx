"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import {
  ChevronRightIcon,
  CollectionIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FeedbackState } from "@/components/ui/feedback-state";
import { Input } from "@/components/ui/input";
import {
  createCollectionAction,
  deleteCollectionAction,
  updateCollectionAction,
} from "@/lib/collections/actions";
import type { CollectionSummary } from "@/lib/collections/types";

type DialogState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; collection: CollectionSummary }
  | { kind: "delete"; collection: CollectionSummary };

export function CollectionsView({ collections }: { collections: CollectionSummary[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>({ kind: "closed" });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setName("");
    setDescription("");
    setFeedback(null);
    setDialog({ kind: "create" });
  }

  function openEdit(collection: CollectionSummary) {
    setName(collection.name);
    setDescription(collection.description ?? "");
    setFeedback(null);
    setDialog({ kind: "edit", collection });
  }

  function closeDialog() {
    if (!isPending) setDialog({ kind: "closed" });
  }

  function submitCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dialog.kind !== "create" && dialog.kind !== "edit") return;

    setFeedback(null);
    startTransition(async () => {
      const result =
        dialog.kind === "create"
          ? await createCollectionAction({ name, description })
          : await updateCollectionAction({ id: dialog.collection.id, name, description });

      if (!result.ok) {
        setFeedback(result.message);
        return;
      }

      setDialog({ kind: "closed" });
      setFeedback(result.message);
      router.refresh();
    });
  }

  function confirmDelete() {
    if (dialog.kind !== "delete") return;
    const collection = dialog.collection;
    setFeedback(null);
    startTransition(async () => {
      const result = await deleteCollectionAction({ id: collection.id });
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
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border bg-canvas px-4 pb-5 pt-6 sm:px-7 lg:px-8 lg:pt-7">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">
            <span className="size-1.5 rounded-full bg-nav-accent ring-2 ring-accent-muted" aria-hidden="true" />
            Saved requests
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-text sm:text-[1.625rem]">
            Collections
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-text-muted">
            Organize related API endpoints into focused, reusable groups.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="size-4" />
          New collection
        </Button>
      </header>

      <div className="min-w-0 flex-1 px-4 py-5 sm:px-7 lg:px-8 lg:py-7">
        {feedback && dialog.kind === "closed" ? (
          <p
            role="status"
            className="mb-4 rounded-xl border border-success/25 bg-success-muted px-4 py-3 text-sm text-success-soft"
          >
            {feedback}
          </p>
        ) : null}

        {collections.length === 0 ? (
          <section className="rounded-[22px] border border-border-strong bg-surface-raised shadow-[0_2px_8px_rgba(75,60,39,0.045)]">
            <FeedbackState
              icon={<CollectionIcon className="size-5" />}
              title="No collections yet"
              description="Create a collection to organize related API endpoints and saved request configurations."
              action={
                <Button onClick={openCreate}>
                  <PlusIcon className="size-4" />
                  Create collection
                </Button>
              }
            />
          </section>
        ) : (
          <section
            aria-label="Your collections"
            className="overflow-hidden rounded-[20px] border border-border-strong bg-surface-raised shadow-[0_2px_8px_rgba(75,60,39,0.045)]"
          >
            <ul className="divide-y divide-border">
              {collections.map((collection) => (
                <li key={collection.id} className="group flex min-w-0 items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-hover/60 sm:px-5">
                  <Link
                    href={`/collections/${collection.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-subtle text-text-secondary">
                      <CollectionIcon className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text">
                        {collection.name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                        <span>
                          {collection.endpointCount} {collection.endpointCount === 1 ? "endpoint" : "endpoints"}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Updated {formatDate(collection.updatedAt)}</span>
                      </span>
                      {collection.description ? (
                        <span className="mt-1.5 block line-clamp-2 text-xs leading-5 text-text-subtle">
                          {collection.description}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(collection)}
                      aria-label={`Edit ${collection.name}`}
                    >
                      <EditIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFeedback(null);
                        setDialog({ kind: "delete", collection });
                      }}
                      aria-label={`Delete ${collection.name}`}
                      className="text-danger-soft hover:bg-danger-muted hover:text-danger-soft"
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                    <ChevronRightIcon className="ml-1 size-4 text-text-subtle" />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <Dialog
        open={dialog.kind === "create" || dialog.kind === "edit"}
        onClose={closeDialog}
        title={dialog.kind === "edit" ? "Edit collection" : "Create collection"}
        description="Use a clear name and an optional short description."
        footer={
          <>
            <Button variant="ghost" onClick={closeDialog} disabled={isPending}>Cancel</Button>
            <Button type="submit" form="collection-form" loading={isPending}>
              {dialog.kind === "edit" ? "Save changes" : "Create collection"}
            </Button>
          </>
        }
      >
        <form id="collection-form" onSubmit={submitCollection} className="space-y-4">
          <label className="block text-xs font-semibold text-text-secondary">
            Name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
              autoFocus
              className="mt-1.5 w-full"
            />
          </label>
          <label className="block text-xs font-semibold text-text-secondary">
            Description <span className="font-normal text-text-subtle">(optional)</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={4}
              className="mt-1.5 w-full resize-y rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm leading-5 text-text shadow-[inset_0_1px_1px_rgba(72,58,39,0.04)] placeholder:text-text-muted hover:border-border-hover"
            />
          </label>
          {feedback ? <p role="alert" className="text-sm text-danger-soft">{feedback}</p> : null}
        </form>
      </Dialog>

      <Dialog
        open={dialog.kind === "delete"}
        onClose={closeDialog}
        title={dialog.kind === "delete" ? `Delete ${dialog.collection.name}?` : "Delete collection?"}
        description={
          dialog.kind === "delete"
            ? `This will permanently remove the collection and its ${dialog.collection.endpointCount} saved ${dialog.collection.endpointCount === 1 ? "endpoint" : "endpoints"}.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={closeDialog} disabled={isPending}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} loading={isPending}>Delete collection</Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-text-muted">This action cannot be undone.</p>
        {feedback ? <p role="alert" className="mt-3 text-sm text-danger-soft">{feedback}</p> : null}
      </Dialog>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
