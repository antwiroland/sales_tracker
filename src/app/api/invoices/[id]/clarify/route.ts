import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models";
import { ok, route, requirePermission, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { INVOICE_STATUS, AUDIT_ACTIONS, NOTIFICATION_TYPES } from "@/lib/constants";

const schema = z.object({ note: z.string().min(1, "A clarification note is required") });

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (req: Request, ctx: Ctx) => {
  const actor = await requirePermission("invoice.review");
  await connectDB();
  const { id } = await ctx.params;
  const { note } = schema.parse(await req.json());

  const invoice = await Invoice.findById(id);
  if (!invoice) throw new ApiError(404, "Invoice not found");

  // Returned to the salesperson as a draft they can amend and resubmit.
  invoice.status = INVOICE_STATUS.DRAFT;
  invoice.clarificationNote = note;
  await invoice.save();

  await audit({
    actorId: actor.id,
    actorName: actor.name ?? "",
    action: AUDIT_ACTIONS.CLARIFICATION_REQUESTED,
    entity: "Invoice",
    entityId: id,
    meta: { invoiceNumber: invoice.invoiceNumber, note },
  });

  await notify({
    userId: String(invoice.employeeId),
    type: NOTIFICATION_TYPES.CLARIFICATION_REQUESTED,
    title: "Clarification requested",
    message: `Invoice ${invoice.invoiceNumber}: ${note}`,
    link: "/dashboard/sales/invoices",
  });

  return ok({ invoice });
});
