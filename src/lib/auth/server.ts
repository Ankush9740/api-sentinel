import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getSessionUserId } from "@/lib/auth/authorization";
import { getAuthEnvironmentStatus } from "@/lib/env/server";

export interface AuthenticatedUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  const id = getSessionUserId(session);

  if (!id) return null;

  return {
    id,
    name: session?.user.name ?? null,
    email: session?.user.email ?? null,
    image: session?.user.image ?? null,
  };
}

export async function requireAuthenticatedUser() {
  if (!getAuthEnvironmentStatus().isConfigured) {
    redirect("/?notice=configuration");
  }

  let user: AuthenticatedUser | null;

  try {
    user = await getAuthenticatedUser();
  } catch {
    redirect("/auth/error?error=SessionUnavailable");
  }

  if (!user) {
    redirect("/?notice=signin-required");
  }

  return user;
}
