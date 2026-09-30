import "server-only";

import { z } from "zod";

const postgresUrlSchema = z
  .url()
  .refine(
    (value) => {
      const protocol = new URL(value).protocol;
      return protocol === "postgres:" || protocol === "postgresql:";
    },
    { message: "Expected a PostgreSQL connection URL." },
  );

const authEnvironmentSchema = z.object({
  AUTH_SECRET: z.string().trim().min(32),
  AUTH_GITHUB_ID: z.string().trim().min(1),
  AUTH_GITHUB_SECRET: z.string().trim().min(1),
  DATABASE_URL: postgresUrlSchema,
});

export class ServerConfigurationError extends Error {
  constructor(message = "Required server configuration is unavailable.") {
    super(message);
    this.name = "ServerConfigurationError";
  }
}

export function getAuthEnvironmentStatus() {
  const result = authEnvironmentSchema.safeParse({
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  });

  return { isConfigured: result.success } as const;
}

export function getDatabaseUrl() {
  const result = postgresUrlSchema.safeParse(process.env.DATABASE_URL);

  if (!result.success) {
    throw new ServerConfigurationError("Database configuration is unavailable.");
  }

  return result.data;
}
