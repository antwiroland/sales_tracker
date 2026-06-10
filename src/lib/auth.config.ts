import type { NextAuthConfig } from "next-auth";
import type { Role } from "./constants";

/**
 * Edge-safe NextAuth config: no database / Node-only imports here so it can be
 * used by middleware. The Credentials provider (which touches the DB) is added
 * in auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8h
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.branchId = user.branchId ?? null;
        token.name = user.name;
        token.picture = user.image ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = token.role as Role;
        session.user.branchId = (token.branchId as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
