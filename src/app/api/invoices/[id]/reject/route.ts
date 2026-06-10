import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models";
import { ok, route, requirePermission, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { INVOICE_STATUS, AUDIT_ACTIONS, NOTIFICATION_TYPES } from "@/lib/constants";

const schema = z.object({ reason: z.string().min(1, "A rejection reason is required") });

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (req: Request, ctx: Ctx) => {
  const actor = await requirePermission("invoice.review");
  await connectDB();
  const { id } = await ctx.params;
  const { reason } = schema.parse(await req.json());

  const invoice = await Invoice.findById(id);
  if (!invoice) throw new ApiError(404, "Invoice not found");

  invoice.status = INVOICE_STATUS.REJECTED;
  invoice.supervisorId = (invoice.supervisorId as never) ?? (actor.id as never);
  invoice.rejectionReason = reason;
  invoice.approvalDate = new Date();
  await invoice.save();

  await audit({
    actorId: actor.id,
    actorName: actor.name ?? "",
    action: AUDIT_ACTIONS.INVOICE_REJECTED,
    entity: "Invoice",
    entityId: id,
    meta: { invoiceNumber: invoice.invoiceNumber, reason },
  });

  await notify({
    userId: String(invoice.employeeId),
    type: NOTIFICATION_TYPES.INVOICE_REJECTED,
    title: "Invoice rejected",
    message: `Invoice ${invoice.invoiceNumber} was rejected: ${reason}`,
    link: "/dashboard/sales",
  });

  return ok({ invoice });
});
