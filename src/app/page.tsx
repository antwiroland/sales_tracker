import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homeForRole } from "@/lib/rbac";
import type { Role } from "@/lib/constants";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(homeForRole(session.user.role as Role));
}
