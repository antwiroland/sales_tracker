import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Branch } from "@/models";
import { ok, route, requireUser, requirePermission } from "@/lib/api";

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  location: z.string().optional(),
  managerId: z.string().optional().nullable(),
});

export const GET = route(async () => {
  await requireUser();
  await connectDB();
  const branches = await Branch.find({})
    .populate("managerId", "firstName lastName")
    .sort({ name: 1 })
    .lean();
  return ok({ branches });
});

export const POST = route(async (req: Request) => {
  await requirePermission("branch.manage");
  await connectDB();
  const body = createSchema.parse(await req.json());
  const branch = await Branch.create({
    ...body,
    managerId: body.managerId || undefined,
  });
  return ok({ branch }, { status: 201 });
});
