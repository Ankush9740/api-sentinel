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
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";
import {
  planHeaderUpdate,
  prepareHeadersForCreate,
  resolveHeadersForExecution,
  toClientHeader,
} from "@/lib/security/request-header-secrets";
import type { ValidatedExecutionRequest } from "@/lib/validation/execution";

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
      assertions: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
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
    headers: endpoint.requestHeaders.map(toClientHeader),
    assertions: endpoint.assertions.map((assertion) => ({
      id: assertion.id,
      type: assertion.type,
      operator: assertion.operator,
      target: assertion.target,
      expectedValue: assertion.expectedValue,
      enabled: assertion.enabled,
      position: assertion.position,
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

  const requestHeaders = await prepareHeadersForCreate(input.headers, encryptSecret);

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
        create: requestHeaders,
      },
      assertions: {
        create: input.assertions.map((assertion, position) => ({
          ...assertion,
          position,
        })),
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
    select: {
      id: true,
      requestHeaders: {
        select: {
          id: true,
          key: true,
          value: true,
          valueKind: true,
          enabled: true,
          sensitive: true,
        },
      },
    },
  });
  if (!endpoint) throw new ResourceNotFoundError();

  const headerPlan = await planHeaderUpdate(
    endpoint.requestHeaders,
    input.headers,
    encryptSecret,
  );

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.endpoint.update({
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
        assertions: {
          deleteMany: {},
          create: input.assertions.map((assertion, position) => ({
            ...assertion,
            position,
          })),
        },
      },
      select: { id: true },
    });

    const keepIds = headerPlan.keep.map((header) => header.id);
    await transaction.requestHeader.deleteMany({
      where: keepIds.length > 0
        ? { endpointId: endpoint.id, id: { notIn: keepIds } }
        : { endpointId: endpoint.id },
    });
    for (const header of headerPlan.keep) {
      const result = await transaction.requestHeader.updateMany({
        where: { id: header.id, endpointId: endpoint.id },
        data: {
          key: header.key,
          enabled: header.enabled,
          sensitive: header.sensitive,
        },
      });
      if (result.count !== 1) throw new ResourceNotFoundError();
    }
    if (headerPlan.create.length > 0) {
      await transaction.requestHeader.createMany({
        data: headerPlan.create.map((header) => ({
          endpointId: endpoint.id,
          ...header,
        })),
      });
    }
    return updated;
  });
}

export async function resolveExecutionHeadersForUser(
  authenticatedUserId: string,
  endpointId: string | null,
  drafts: ValidatedExecutionRequest["headers"],
) {
  if (!endpointId) {
    return resolveHeadersForExecution([], drafts, decryptSecret);
  }

  const endpoint = await prisma.endpoint.findFirst({
    where: endpointOwnedByUserWhere(authenticatedUserId, endpointId),
    select: {
      requestHeaders: {
        select: {
          id: true,
          key: true,
          value: true,
          valueKind: true,
          enabled: true,
          sensitive: true,
        },
      },
    },
  });
  if (!endpoint) throw new ResourceNotFoundError();
  return resolveHeadersForExecution(endpoint.requestHeaders, drafts, decryptSecret);
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
