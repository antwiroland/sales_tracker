import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models";
import { ROLES, INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/lib/constants";
import { can } from "@/lib/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { DeleteInvoiceButton } from "@/components/InvoiceActions";

function statusColor(s: InvoiceStatus) {
  return s === "APPROVED" ? "green" : s === "REJECTED" ? "red" : s === "DRAFT" ? "slate" : "amber";
}

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  await connectDB();

  const filter: Record<string, unknown> =
    user.role === ROLES.SALES
      ? { employeeId: user.id }
      : user.role === ROLES.SUPERVISOR || user.role === ROLES.SALES_MANAGER
        ? { supervisorId: user.id }
        : {};

  const invoices = await Invoice.find(filter)
    .populate("employeeId", "firstName lastName")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const canDelete = can(user.role, "invoice.delete");

  return (
    <>
      <PageHeader
        title="Purchase Orders"
        subtitle={user.role === ROLES.SALES ? "Your submitted sales records" : "Purchase orders in scope"}
        action={
          user.role === ROLES.SALES ? (
            <Link href="/dashboard/invoices/new" className="btn-primary">
              <FilePlus2 size={16} /> New Purchase Order
            </Link>
          ) : undefined
        }
      />

      {invoices.length === 0 ? (
        <EmptyState title="No purchase orders" message="Nothing here yet." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>PO #</Th>
              {user.role !== ROLES.SALES && <Th>Employee</Th>}
              <Th>Customer</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              {canDelete && <Th>Actions</Th>}
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
                  {canDelete && (
                    <Td>
                      <DeleteInvoiceButton id={String(inv._id)} label={inv.invoiceNumber} />
                    </Td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
