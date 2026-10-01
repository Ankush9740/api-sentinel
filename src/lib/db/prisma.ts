import "server-only";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseUrl } from "@/lib/env/server";

const globalForPrisma = globalThis as unknown as {
  apiSentinelPrisma?: PrismaClient;
};

let runtimePrisma: PrismaClient | undefined;

function getPrismaClient() {
  if (runtimePrisma) {
    return runtimePrisma;
  }

  if (globalForPrisma.apiSentinelPrisma) {
    runtimePrisma = globalForPrisma.apiSentinelPrisma;
    return runtimePrisma;
  }

  const adapter = new PrismaNeon({ connectionString: getDatabaseUrl() });
  runtimePrisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.apiSentinelPrisma = runtimePrisma;
  }

  return runtimePrisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);

    return typeof value === "function" ? value.bind(client) : value;
  },
});
