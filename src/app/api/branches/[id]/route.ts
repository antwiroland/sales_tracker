import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Branch } from "@/models";
import { ok, route, requirePermission, ApiError } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  location: z.string().optional(),
  managerId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export const PUT = route(async (req: Request, ctx: Ctx) => {
  await requirePermission("branch.manage");
  await connectDB();
  const { id } = await ctx.params;
  const body = updateSchema.parse(await req.json());

  const update: Record<string, unknown> = { ...body };
  if (body.managerId === "") update.managerId = null;

  const branch = await Branch.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!branch) throw new ApiError(404, "Branch not found");
  return ok({ branch });
});
