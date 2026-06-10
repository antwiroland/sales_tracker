import { connectDB } from "@/lib/db";
import { Invoice } from "@/models";
import { ok, route, requirePermission, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { getEmployeeSummary } from "@/lib/kpi-engine";
import { INVOICE_STATUS, AUDIT_ACTIONS, NOTIFICATION_TYPES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (_req: Request, ctx: Ctx) => {
  const actor = await requirePermission("invoice.review");
  await connectDB();
  const { id } = await ctx.params;

  const invoice = await Invoice.findById(id);
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.status === INVOICE_STATUS.APPROVED)
    throw new ApiError(409, "Invoice already approved");

  invoice.status = INVOICE_STATUS.APPROVED;
  invoice.supervisorId = (invoice.supervisorId as never) ?? (actor.id as never);
  invoice.approvalDate = new Date();
  invoice.rejectionReason = "";
  await invoice.save();

  await audit({
    actorId: actor.id,
    actorName: actor.name ?? "",
    action: AUDIT_ACTIONS.INVOICE_APPROVED,
    entity: "Invoice",
    entityId: id,
    meta: { invoiceNumber: invoice.invoiceNumber, amount: invoice.amount },
  });

  await notify({
    userId: String(invoice.employeeId),
    type: NOTIFICATION_TYPES.INVOICE_APPROVED,
    title: "Invoice approved",
    message: `Invoice ${invoice.invoiceNumber} (${formatCurrency(invoice.amount)}) was approved.`,
    link: "/dashboard/sales",
  });

  // Approval-driven KPI update: check whether this approval crossed the target.
  const summary = await getEmployeeSummary(
    String(invoice.employeeId),
    invoice.month as number,
    invoice.year as number,
  );
  if (summary && summary.target > 0) {
    const before = summary.approved - invoice.amount;
    if (before < summary.target && summary.approved >= summary.target) {
      await notify({
        userId: String(invoice.employeeId),
        type: NOTIFICATION_TYPES.TARGET_ACHIEVED,
        title: "🎯 Target achieved!",
        message: `You reached your ${summary.target ? formatCurrency(summary.target) : ""} target.`,
        link: "/dashboard/sales",
      });
    }
  }

  return ok({ invoice, summary });
});
