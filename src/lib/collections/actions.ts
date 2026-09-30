"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth/server";
import {
  createCollectionForUser,
  createEndpointForUser,
  deleteCollectionForUser,
  deleteEndpointForUser,
  ResourceNotFoundError,
  updateCollectionForUser,
  updateEndpointForUser,
} from "@/lib/collections/repository";
import {
  collectionIdSchema,
  collectionInputSchema,
  collectionMutationSchema,
  endpointIdSchema,
  endpointInputSchema,
  endpointMutationSchema,
} from "@/lib/validation/phase2";

export type MutationResult<T = undefined> =
  | { ok: true; message: string; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

async function getActionUserId() {
  const user = await getAuthenticatedUser();
  return user?.id ?? null;
}

function validationFailure(error: { flatten(): { fieldErrors: Record<string, string[]> } }) {
  return {
    ok: false,
    message: "Review the highlighted request details and try again.",
    fieldErrors: error.flatten().fieldErrors,
  } as const;
}

function safeFailure(error: unknown): MutationResult<never> {
  if (error instanceof ResourceNotFoundError) {
    return { ok: false, message: "That resource is unavailable or you no longer have access." };
  }

  console.error(
    "A Phase 2 persistence operation failed.",
    error instanceof Error ? error.name : "UnknownError",
  );
  return { ok: false, message: "We couldn't save that change. Please try again." };
}

export async function createCollectionAction(input: unknown): Promise<MutationResult<{ id: string }>> {
  const userId = await getActionUserId();
  if (!userId) return { ok: false, message: "Your session has expired. Sign in again." };

  const parsed = collectionInputSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    const collection = await createCollectionForUser(userId, parsed.data);
    revalidatePath("/collections");
    return { ok: true, message: "Collection created.", data: collection };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateCollectionAction(input: unknown): Promise<MutationResult> {
  const userId = await getActionUserId();
  if (!userId) return { ok: false, message: "Your session has expired. Sign in again." };

  const parsed = collectionMutationSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await updateCollectionForUser(userId, parsed.data.id, parsed.data);
    revalidatePath("/collections");
    revalidatePath(`/collections/${parsed.data.id}`);
    return { ok: true, message: "Collection updated.", data: undefined };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function deleteCollectionAction(input: unknown): Promise<MutationResult> {
  const userId = await getActionUserId();
  if (!userId) return { ok: false, message: "Your session has expired. Sign in again." };

  const parsed = collectionIdSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await deleteCollectionForUser(userId, parsed.data.id);
    revalidatePath("/collections");
    revalidatePath("/workspace");
    return { ok: true, message: "Collection deleted.", data: undefined };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function createEndpointAction(input: unknown): Promise<MutationResult<{ id: string }>> {
  const userId = await getActionUserId();
  if (!userId) return { ok: false, message: "Your session has expired. Sign in again." };

  const parsed = endpointInputSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    const endpoint = await createEndpointForUser(userId, parsed.data);
    revalidatePath("/collections");
    revalidatePath(`/collections/${parsed.data.collectionId}`);
    revalidatePath("/workspace");
    return { ok: true, message: "Request saved.", data: endpoint };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function updateEndpointAction(input: unknown): Promise<MutationResult<{ id: string }>> {
  const userId = await getActionUserId();
  if (!userId) return { ok: false, message: "Your session has expired. Sign in again." };

  const parsed = endpointMutationSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    const endpoint = await updateEndpointForUser(userId, parsed.data.id, parsed.data);
    revalidatePath("/collections");
    revalidatePath(`/collections/${parsed.data.collectionId}`);
    revalidatePath("/workspace");
    return { ok: true, message: "Request saved.", data: endpoint };
  } catch (error) {
    return safeFailure(error);
  }
}

export async function deleteEndpointAction(input: unknown): Promise<MutationResult> {
  const userId = await getActionUserId();
  if (!userId) return { ok: false, message: "Your session has expired. Sign in again." };

  const parsed = endpointIdSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await deleteEndpointForUser(userId, parsed.data.id);
    revalidatePath("/collections");
    revalidatePath("/workspace");
    return { ok: true, message: "Endpoint deleted.", data: undefined };
  } catch (error) {
    return safeFailure(error);
  }
}
