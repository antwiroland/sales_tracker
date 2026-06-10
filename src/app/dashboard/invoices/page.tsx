import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models";
import { ROLES, INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, Table, Th, Td, Badge, EmptyState } from "@/components/ui";

function statusColor(s: InvoiceStatus) {
  return s === "APPROVED" ? "green" : s === "REJECTED" ? "red" : s === "DRAFT" ? "slate" : "amber";
}

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  await connectDB();

  const filter: Record<string, unknown> =
    user.role === ROLES.SALES
      ? { employeeId: user.id }
      : user.role === ROLES.SUPERVISOR
        ? { supervisorId: user.id }
        : {};

  const invoices = await Invoice.find(filter)
    .populate("employeeId", "firstName lastName")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle={user.role === ROLES.SALES ? "Your submitted sales records" : "Invoices in scope"}
        action={
          user.role === ROLES.SALES ? (
            <Link href="/dashboard/invoices/new" className="btn-primary">
              <FilePlus2 size={16} /> Submit Invoice
            </Link>
          ) : undefined
        }
      />

      {invoices.length === 0 ? (
        <EmptyState title="No invoices" message="Nothing here yet." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Invoice #</Th>
              {user.role !== ROLES.SALES && <Th>Employee</Th>}
              <Th>Customer</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const emp = inv.employeeId as unknown as { firstName?: string; lastName?: string };
              return (
                <tr key={String(inv._id)}>
                  <Td className="font-medium text-slate-800">{inv.invoiceNumber}</Td>
                  {user.role !== ROLES.SALES && (
                    <Td>{emp ? `${emp.firstName} ${emp.lastName}` : "—"}</Td>
                  )}
                  <Td>{inv.customerName}</Td>
                  <Td className="font-semibold">{formatCurrency(inv.amount)}</Td>
                  <Td>{formatDate(inv.invoiceDate as Date)}</Td>
                  <Td>
                    <Badge color={statusColor(inv.status as InvoiceStatus)}>
                      {INVOICE_STATUS_LABELS[inv.status as InvoiceStatus]}
                    </Badge>
                    {inv.status === "DRAFT" && inv.clarificationNote && (
                      <p className="mt-1 text-xs text-amber-600">
                        Clarify: {inv.clarificationNote}
                      </p>
                    )}
                    {inv.status === "REJECTED" && inv.rejectionReason && (
                      <p className="mt-1 text-xs text-red-500">{inv.rejectionReason}</p>
                    )}
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
