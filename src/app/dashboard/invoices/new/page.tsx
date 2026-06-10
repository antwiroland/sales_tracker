import { requirePage } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { InvoiceForm } from "@/components/InvoiceForm";

export default async function NewInvoicePage() {
  await requirePage("invoice.create");
  return (
    <>
      <PageHeader
        title="Submit Invoice"
        subtitle="Create a sales record for supervisor approval"
      />
      <InvoiceForm />
    </>
  );
}
