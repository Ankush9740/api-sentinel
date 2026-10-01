import "server-only";

import { z } from "zod";

const postgresUrlSchema = z
  .url()
  .refine(
    (value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "postgres:" || protocol === "postgresql:";
      } catch {
        return false;
      }
    },
    { message: "Expected a PostgreSQL connection URL." },
  );

const authUrlSchema = z
  .url()
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return (url.protocol === "http:" || url.protocol === "https:") &&
          !url.username &&
          !url.password &&
          url.pathname === "/" &&
          !url.search &&
          !url.hash;
      } catch {
        return false;
      }
    },
    { message: "Expected the canonical HTTP(S) application origin." },
  );

const authEnvironmentSchema = z.object({
  AUTH_URL: authUrlSchema,
  AUTH_SECRET: z.string().trim().min(32),
  AUTH_GITHUB_ID: z.string().trim().min(1),
  AUTH_GITHUB_SECRET: z.string().trim().min(1),
  DATABASE_URL: postgresUrlSchema,
});

const googleAuthEnvironmentSchema = z.object({
  AUTH_GOOGLE_ID: z.string().trim().min(1),
  AUTH_GOOGLE_SECRET: z.string().trim().min(1),
});

export class ServerConfigurationError extends Error {
  constructor(message = "Required server configuration is unavailable.") {
    super(message);
    this.name = "ServerConfigurationError";
  }
}

export function getAuthEnvironmentStatus() {
  const result = authEnvironmentSchema.safeParse({
    AUTH_URL: process.env.AUTH_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  });

  return { isConfigured: result.success } as const;
}

export function getGoogleAuthEnvironmentStatus() {
  const result = googleAuthEnvironmentSchema.safeParse({
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
  });

  return { isConfigured: result.success } as const;
}

export function getGoogleAuthProviderConfiguration() {
  const result = googleAuthEnvironmentSchema.safeParse({
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
  });

  if (!result.success) return null;

  return {
    clientId: result.data.AUTH_GOOGLE_ID,
    clientSecret: result.data.AUTH_GOOGLE_SECRET,
  } as const;
}

export function getDatabaseUrl() {
  const result = postgresUrlSchema.safeParse(process.env.DATABASE_URL);

  if (!result.success) {
    throw new ServerConfigurationError("Database configuration is unavailable.");
  }

  return result.data;
}
