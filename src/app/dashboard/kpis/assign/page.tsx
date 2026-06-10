import { requirePage } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { KpiAssign } from "@/components/KpiAssign";

export default async function AssignKpiPage() {
  await requirePage("kpi.assign");
  return (
    <>
      <PageHeader
        title="Assign KPIs"
        subtitle="Assign targets individually, in bulk, or via Excel upload"
      />
      <KpiAssign />
    </>
  );
}
