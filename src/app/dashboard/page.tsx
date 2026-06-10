import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { homeForRole } from "@/lib/rbac";

export default async function DashboardIndex() {
  const user = await getCurrentUser();
  redirect(homeForRole(user.role));
}
