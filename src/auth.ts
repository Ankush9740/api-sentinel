import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { prisma } from "@/lib/db/prisma";
import { getGoogleAuthProviderConfiguration } from "@/lib/env/server";

const googleConfiguration = getGoogleAuthProviderConfiguration();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub,
    ...(googleConfiguration ? [Google(googleConfiguration)] : []),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
