import { requirePage } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models";
import { PageHeader, Table, Th, Td, Badge, EmptyState } from "@/components/ui";

export default async function AuditPage() {
  await requirePage("audit.view");
  await connectDB();
  const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(200).lean();

  return (
    <>
      <PageHeader title="Audit Log" subtitle="System activity trail (latest 200 events)" />
      {logs.length === 0 ? (
        <EmptyState title="No audit entries yet" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Time</Th>
              <Th>Actor</Th>
              <Th>Action</Th>
              <Th>Entity</Th>
              <Th>Details</Th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={String(l._id)}>
                <Td className="whitespace-nowrap text-xs text-slate-500">
                  {new Date(l.createdAt as Date).toLocaleString()}
                </Td>
                <Td>{l.actorName || "—"}</Td>
                <Td>
                  <Badge color="blue">{l.action}</Badge>
                </Td>
                <Td>{l.entity || "—"}</Td>
                <Td className="max-w-xs truncate text-xs text-slate-500">
                  {l.meta ? JSON.stringify(l.meta) : ""}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
