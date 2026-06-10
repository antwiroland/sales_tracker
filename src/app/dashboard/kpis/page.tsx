import { requirePage } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Kpi } from "@/models";
import { PageHeader, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { KpiForm } from "@/components/AdminForms";

export default async function KpisPage() {
  await requirePage("kpi.manage");
  await connectDB();
  const kpis = await Kpi.find({}).sort({ createdAt: -1 }).lean();

  return (
    <>
      <PageHeader title="KPI Definitions" subtitle="Create and manage KPI templates" />
      <div className="mb-6">
        <KpiForm />
      </div>

      {kpis.length === 0 ? (
        <EmptyState title="No KPIs yet" message="Create your first KPI template above." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>Unit</Th>
              <Th>Weight</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {kpis.map((k) => (
              <tr key={String(k._id)}>
                <Td className="font-medium text-slate-800">
                  {k.name}
                  {k.description && (
                    <span className="block text-xs font-normal text-slate-400">
                      {k.description}
                    </span>
                  )}
                </Td>
                <Td>{k.category}</Td>
                <Td className="capitalize">{k.unit}</Td>
                <Td>{k.weight}</Td>
                <Td>
                  <Badge color={k.active ? "green" : "slate"}>
                    {k.active ? "Active" : "Inactive"}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
