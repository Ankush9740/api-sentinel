"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { getAuthEnvironmentStatus } from "@/lib/env/server";

export async function signInWithGitHub() {
  if (!getAuthEnvironmentStatus().isConfigured) {
    redirect("/?notice=configuration");
  }

  try {
    await signIn("github", { redirectTo: "/workspace" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/auth/error?error=${encodeURIComponent(error.type)}`);
    }

    throw error;
  }
}

export async function signOutFromApp() {
  try {
    await signOut({ redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/auth/error?error=SignOutError");
    }

    throw error;
  }
}
