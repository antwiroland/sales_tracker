import { requirePage } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { ReportViewer } from "@/components/ReportViewer";

export default async function ReportsPage() {
  await requirePage("reports.view");
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Generate and export performance reports (PDF, Excel, CSV)"
      />
      <ReportViewer />
    </>
  );
}
