import { requirePage } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Branch, User } from "@/models";
import { ROLES } from "@/lib/constants";
import { PageHeader, Table, Th, Td, EmptyState } from "@/components/ui";
import { BranchForm, BranchEdit } from "@/components/AdminForms";

export default async function BranchesPage() {
  await requirePage("branch.manage");
  await connectDB();
  const branches = await Branch.find({})
    .populate("managerId", "firstName lastName")
    .sort({ name: 1 })
    .lean();

  const counts = await User.aggregate<{ _id: string; count: number }>([
    { $match: { role: ROLES.SALES, branchId: { $ne: null } } },
    { $group: { _id: "$branchId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  return (
    <>
      <PageHeader title="Branches" subtitle="Manage company branches" />
      <div className="mb-6">
        <BranchForm />
      </div>

      {branches.length === 0 ? (
        <EmptyState title="No branches" message="Create your first branch above." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Branch</Th>
              <Th>Code</Th>
              <Th>Location</Th>
              <Th>Manager</Th>
              <Th>Sales Staff</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => {
              const mgr = b.managerId as unknown as { firstName?: string; lastName?: string };
              return (
                <tr key={String(b._id)}>
                  <Td className="font-medium text-slate-800">{b.name}</Td>
                  <Td>{b.code || "—"}</Td>
                  <Td>{b.location || "—"}</Td>
                  <Td>{mgr ? `${mgr.firstName} ${mgr.lastName}` : "—"}</Td>
                  <Td>{countMap.get(String(b._id)) ?? 0}</Td>
                  <Td>
                    <BranchEdit
                      branch={{
                        _id: String(b._id),
                        name: b.name,
                        code: b.code ?? "",
                        location: b.location ?? "",
                      }}
                    />
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
