import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { ok, route, requirePermission, requireUser } from "@/lib/api";
import { audit } from "@/lib/audit";
import { ALL_ROLES, AUDIT_ACTIONS } from "@/lib/constants";

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(ALL_ROLES as [string, ...string[]]),
  position: z.string().optional(),
  branchId: z.string().optional().nullable(),
  supervisorId: z.string().optional().nullable(),
});

export const GET = route(async (req: Request) => {
  await requireUser();
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter: Record<string, unknown> = {};
  if (searchParams.get("role")) filter.role = searchParams.get("role");
  if (searchParams.get("branchId")) filter.branchId = searchParams.get("branchId");
  if (searchParams.get("supervisorId"))
    filter.supervisorId = searchParams.get("supervisorId");

  const users = await User.find(filter)
    .populate("branchId", "name")
    .populate("supervisorId", "firstName lastName")
    .sort({ createdAt: -1 })
    .lean();
  return ok({ users });
});

export const POST = route(async (req: Request) => {
  const actor = await requirePermission("user.manage");
  await connectDB();
  const body = createSchema.parse(await req.json());

  const hashed = await bcrypt.hash(body.password, 10);
  const user = await User.create({
    ...body,
    email: body.email.toLowerCase(),
    password: hashed,
    branchId: body.branchId || undefined,
    supervisorId: body.supervisorId || undefined,
  });

  await audit({
    actorId: actor.id,
    actorName: actor.name ?? "",
    action: AUDIT_ACTIONS.USER_CREATED,
    entity: "User",
    entityId: String(user._id),
    meta: { email: user.email, role: user.role },
  });

  const { password: _pw, ...safe } = user.toObject();
  return ok({ user: safe }, { status: 201 });
});
