import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { ok, route, requirePermission, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { ALL_ROLES, AUDIT_ACTIONS } from "@/lib/constants";

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(ALL_ROLES as [string, ...string[]]).optional(),
  position: z.string().optional(),
  branchId: z.string().nullable().optional(),
  supervisorId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  await requirePermission("user.manage");
  await connectDB();
  const { id } = await ctx.params;
  const user = await User.findById(id)
    .populate("branchId", "name")
    .populate("supervisorId", "firstName lastName")
    .lean();
  if (!user) throw new ApiError(404, "User not found");
  return ok({ user });
});

export const PUT = route(async (req: Request, ctx: Ctx) => {
  const actor = await requirePermission("user.manage");
  await connectDB();
  const { id } = await ctx.params;
  const body = updateSchema.parse(await req.json());

  const update: Record<string, unknown> = { ...body };
  if (body.password) update.password = await bcrypt.hash(body.password, 10);
  if (body.email) update.email = body.email.toLowerCase();
  if (body.branchId === "") update.branchId = null;
  if (body.supervisorId === "") update.supervisorId = null;

  const user = await User.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!user) throw new ApiError(404, "User not found");

  await audit({
    actorId: actor.id,
    actorName: actor.name ?? "",
    action: AUDIT_ACTIONS.USER_UPDATED,
    entity: "User",
    entityId: id,
    meta: { fields: Object.keys(body) },
  });

  return ok({ user });
});
