import { redirect } from "next/navigation";
import { auth } from "./auth";
import { can, type Permission } from "./rbac";
import type { SessionUser } from "./api";

/** For server components: returns the user or redirects to /login. */
export async function getCurrentUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

/** Require a permission in a server component; redirects on failure. */
export async function requirePage(permission: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!can(user.role, permission)) redirect("/dashboard");
  return user;
}
