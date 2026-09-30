import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  collectionOwnedByUserWhere,
  endpointOwnedByUserWhere,
} from "../src/lib/collections/ownership";

config({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for the Neon integration test.");

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const suffix = randomUUID();
const userAId = `phase2-a-${suffix}`;
const userBId = `phase2-b-${suffix}`;

try {
  await prisma.user.createMany({
    data: [{ id: userAId }, { id: userBId }],
  });

  const collectionA = await prisma.collection.create({
    data: {
      userId: userAId,
      name: "Integration A",
      endpoints: {
        create: {
          name: "List users",
          method: "GET",
          url: "https://api.example.com/users",
          queryParameters: {
            create: [{ key: "page", value: "1", enabled: true }],
          },
          requestHeaders: {
            create: [{ key: "Accept", value: "application/json", enabled: true }],
          },
        },
      },
    },
    include: { endpoints: true },
  });
  await prisma.collection.create({
    data: { userId: userBId, name: "Integration B" },
  });

  const endpointId = collectionA.endpoints[0].id;
  assert.equal(
    await prisma.collection.count({
      where: collectionOwnedByUserWhere(userAId, collectionA.id),
    }),
    1,
  );
  assert.equal(
    await prisma.collection.count({
      where: collectionOwnedByUserWhere(userBId, collectionA.id),
    }),
    0,
  );
  assert.equal(
    await prisma.endpoint.count({
      where: endpointOwnedByUserWhere(userAId, endpointId),
    }),
    1,
  );
  assert.equal(
    await prisma.endpoint.count({
      where: endpointOwnedByUserWhere(userBId, endpointId),
    }),
    0,
  );

  const unauthorizedDelete = await prisma.endpoint.deleteMany({
    where: endpointOwnedByUserWhere(userBId, endpointId),
  });
  assert.equal(unauthorizedDelete.count, 0);

  const authorizedUpdate = await prisma.collection.updateMany({
    where: collectionOwnedByUserWhere(userAId, collectionA.id),
    data: { description: "Updated through an owner-scoped mutation." },
  });
  assert.equal(authorizedUpdate.count, 1);

  const authorizedDelete = await prisma.collection.deleteMany({
    where: collectionOwnedByUserWhere(userAId, collectionA.id),
  });
  assert.equal(authorizedDelete.count, 1);
  assert.equal(await prisma.endpoint.count({ where: { id: endpointId } }), 0);
  assert.equal(await prisma.queryParameter.count({ where: { endpointId } }), 0);
  assert.equal(await prisma.requestHeader.count({ where: { endpointId } }), 0);

  console.log("Phase 2 Neon integration verification passed.");
} finally {
  await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
  await prisma.$disconnect();
}
