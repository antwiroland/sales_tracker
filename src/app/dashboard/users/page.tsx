import { requirePage } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { PageHeader, Table, Th, Td, Badge, Avatar, EmptyState } from "@/components/ui";
import { UserForm } from "@/components/AdminForms";

const roleColor: Record<string, "blue" | "green" | "amber" | "slate" | "red"> = {
  ADMIN: "red",
  MANAGER: "blue",
  SUPERVISOR: "amber",
  SALES: "green",
  EXECUTIVE: "slate",
};

export default async function UsersPage() {
  await requirePage("user.manage");
  await connectDB();
  const users = await User.find({})
    .populate("branchId", "name")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <>
      <PageHeader title="Users" subtitle="Manage system users and roles" />
      <div className="mb-6">
        <UserForm />
      </div>

      {users.length === 0 ? (
        <EmptyState title="No users" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Branch</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const branch = u.branchId as unknown as { name?: string };
              return (
                <tr key={String(u._id)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={`${u.firstName} ${u.lastName}`} src={u.profilePhoto?.url} size={32} />
                      <div>
                        <p className="font-medium text-slate-800">
                          {u.firstName} {u.lastName}
                        </p>
                        {u.position && (
                          <p className="text-xs text-slate-400">{u.position}</p>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <Badge color={roleColor[u.role] ?? "slate"}>
                      {ROLE_LABELS[u.role as Role]}
                    </Badge>
                  </Td>
                  <Td>{branch?.name ?? "—"}</Td>
                  <Td>
                    <Badge color={u.isActive ? "green" : "slate"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
