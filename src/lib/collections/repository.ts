import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  collectionOwnedByUserWhere,
  endpointOwnedByUserWhere,
} from "@/lib/collections/ownership";
import type {
  CollectionDetail,
  CollectionOption,
  CollectionSummary,
  SavedEndpoint,
} from "@/lib/collections/types";
import type { ValidatedEndpointInput } from "@/lib/validation/phase2";

export class ResourceNotFoundError extends Error {
  constructor() {
    super("The requested resource was not found.");
    this.name = "ResourceNotFoundError";
  }
}

export async function listCollectionsForUser(
  authenticatedUserId: string,
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: collectionOwnedByUserWhere(authenticatedUserId),
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    include: { _count: { select: { endpoints: true } } },
  });

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
    endpointCount: collection._count.endpoints,
  }));
}

export async function listCollectionOptionsForUser(
  authenticatedUserId: string,
): Promise<CollectionOption[]> {
  return prisma.collection.findMany({
    where: collectionOwnedByUserWhere(authenticatedUserId),
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getCollectionForUser(
  authenticatedUserId: string,
  collectionId: string,
): Promise<CollectionDetail | null> {
  const collection = await prisma.collection.findFirst({
    where: collectionOwnedByUserWhere(authenticatedUserId, collectionId),
    include: {
      endpoints: {
        orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          method: true,
          url: true,
          updatedAt: true,
        },
      },
      _count: { select: { endpoints: true } },
    },
  });

  if (!collection) return null;

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
    endpointCount: collection._count.endpoints,
    endpoints: collection.endpoints.map((endpoint) => ({
      ...endpoint,
      updatedAt: endpoint.updatedAt.toISOString(),
    })),
  };
}

export async function createCollectionForUser(
  authenticatedUserId: string,
  input: { name: string; description: string | null },
) {
  return prisma.collection.create({
    data: {
      userId: collectionOwnedByUserWhere(authenticatedUserId).userId,
      name: input.name,
      description: input.description,
    },
    select: { id: true },
  });
}

export async function updateCollectionForUser(
  authenticatedUserId: string,
  collectionId: string,
  input: { name: string; description: string | null },
) {
  const result = await prisma.collection.updateMany({
    where: collectionOwnedByUserWhere(authenticatedUserId, collectionId),
    data: { name: input.name, description: input.description },
  });

  if (result.count !== 1) throw new ResourceNotFoundError();
}

export async function deleteCollectionForUser(
  authenticatedUserId: string,
  collectionId: string,
) {
  const result = await prisma.collection.deleteMany({
    where: collectionOwnedByUserWhere(authenticatedUserId, collectionId),
  });

  if (result.count !== 1) throw new ResourceNotFoundError();
}

export async function getEndpointForUser(
  authenticatedUserId: string,
  endpointId: string,
): Promise<SavedEndpoint | null> {
  const endpoint = await prisma.endpoint.findFirst({
    where: endpointOwnedByUserWhere(authenticatedUserId, endpointId),
    include: {
      collection: { select: { id: true, name: true } },
      queryParameters: { orderBy: { createdAt: "asc" } },
      requestHeaders: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!endpoint) return null;

  return {
    id: endpoint.id,
    collectionId: endpoint.collection.id,
    collectionName: endpoint.collection.name,
    name: endpoint.name,
    method: endpoint.method,
    url: endpoint.url,
    body: endpoint.body,
    createdAt: endpoint.createdAt.toISOString(),
    updatedAt: endpoint.updatedAt.toISOString(),
    queryParameters: endpoint.queryParameters.map((parameter) => ({
      id: parameter.id,
      key: parameter.key,
      value: parameter.value,
      enabled: parameter.enabled,
    })),
    headers: endpoint.requestHeaders.map((header) => ({
      id: header.id,
      key: header.key,
      value: header.value,
      enabled: header.enabled,
      sensitive: header.sensitive,
    })),
  };
}

export async function createEndpointForUser(
  authenticatedUserId: string,
  input: ValidatedEndpointInput,
) {
  const collection = await prisma.collection.findFirst({
    where: collectionOwnedByUserWhere(authenticatedUserId, input.collectionId),
    select: { id: true },
  });
  if (!collection) throw new ResourceNotFoundError();

  return prisma.endpoint.create({
    data: {
      collectionId: collection.id,
      name: input.name,
      method: input.method,
      url: input.url,
      body: input.body,
      queryParameters: {
        create: input.queryParameters,
      },
      requestHeaders: {
        create: input.headers,
      },
    },
    select: { id: true },
  });
}

export async function updateEndpointForUser(
  authenticatedUserId: string,
  endpointId: string,
  input: ValidatedEndpointInput,
) {
  const targetCollection = await prisma.collection.findFirst({
    where: collectionOwnedByUserWhere(authenticatedUserId, input.collectionId),
    select: { id: true },
  });
  if (!targetCollection) throw new ResourceNotFoundError();

  const endpoint = await prisma.endpoint.findFirst({
    where: endpointOwnedByUserWhere(authenticatedUserId, endpointId),
    select: { id: true },
  });
  if (!endpoint) throw new ResourceNotFoundError();

  return prisma.endpoint.update({
    where: {
      id: endpoint.id,
      collection: collectionOwnedByUserWhere(authenticatedUserId),
    },
    data: {
      collectionId: targetCollection.id,
      name: input.name,
      method: input.method,
      url: input.url,
      body: input.body,
      queryParameters: {
        deleteMany: {},
        create: input.queryParameters,
      },
      requestHeaders: {
        deleteMany: {},
        create: input.headers,
      },
    },
    select: { id: true },
  });
}

export async function deleteEndpointForUser(
  authenticatedUserId: string,
  endpointId: string,
) {
  const result = await prisma.endpoint.deleteMany({
    where: endpointOwnedByUserWhere(authenticatedUserId, endpointId),
  });

  if (result.count !== 1) throw new ResourceNotFoundError();
}
