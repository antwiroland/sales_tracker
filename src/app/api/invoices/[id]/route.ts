import { connectDB } from "@/lib/db";
import { Invoice } from "@/models";
import { ok, route, requireUser, ApiError } from "@/lib/api";
import { ROLES } from "@/lib/constants";

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
