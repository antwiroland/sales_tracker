import { connectDB } from "@/lib/db";
import { Invoice } from "@/models";
import { ok, route, requireUser, requirePermission, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { ROLES, AUDIT_ACTIONS } from "@/lib/constants";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  await connectDB();
  const { id } = await ctx.params;
  const invoice = await Invoice.findById(id)
    .populate("employeeId", "firstName lastName email")
    .populate("supervisorId", "firstName lastName")
    .lean();
  if (!invoice) throw new ApiError(404, "Invoice not found");

  // Sales personnel may only view their own invoices.
  if (
    user.role === ROLES.SALES &&
    String((invoice.employeeId as { _id?: unknown })?._id ?? invoice.employeeId) !== user.id
  ) {
    throw new ApiError(403, "Forbidden");
  }
  return ok({ invoice });
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  // Sales managers / managers / admins may delete sales records. Supervisors may not.
  const actor = await requirePermission("invoice.delete");
  await connectDB();
  const { id } = await ctx.params;

  const invoice = await Invoice.findByIdAndDelete(id).lean();
  if (!invoice) throw new ApiError(404, "Invoice not found");

  await audit({
    actorId: actor.id,
    actorName: actor.name ?? "",
    action: AUDIT_ACTIONS.INVOICE_DELETED,
    entity: "Invoice",
    entityId: id,
    meta: { invoiceNumber: invoice.invoiceNumber, amount: invoice.amount },
  });

  return ok({ success: true });
});
