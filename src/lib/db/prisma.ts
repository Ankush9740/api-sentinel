import "server-only";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseUrl } from "@/lib/env/server";

const globalForPrisma = globalThis as unknown as {
  apiSentinelPrisma?: PrismaClient;
};

function getPrismaClient() {
  if (globalForPrisma.apiSentinelPrisma) {
    return globalForPrisma.apiSentinelPrisma;
  }

  const adapter = new PrismaNeon({ connectionString: getDatabaseUrl() });
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.apiSentinelPrisma = client;
  }

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);

    return typeof value === "function" ? value.bind(client) : value;
  },
});
