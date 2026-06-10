import { getCurrentUser } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={user.role} />
      <div className="md:pl-64">
        <Topbar name={user.name ?? "User"} role={user.role} image={user.image} />
        <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
