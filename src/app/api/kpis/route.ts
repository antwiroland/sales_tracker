import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Kpi } from "@/models";
import { ok, route, requireUser, requirePermission } from "@/lib/api";
import { audit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.enum(["currency", "count", "percent"]).optional(),
  weight: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

export const GET = route(async (req: Request) => {
  await requireUser();
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter: Record<string, unknown> = {};
  if (searchParams.get("active") === "true") filter.active = true;
  const kpis = await Kpi.find(filter).sort({ createdAt: -1 }).lean();
  return ok({ kpis });
});

export const POST = route(async (req: Request) => {
  const actor = await requirePermission("kpi.manage");
  await connectDB();
  const body = createSchema.parse(await req.json());
  const kpi = await Kpi.create(body);
  await audit({
    actorId: actor.id,
    actorName: actor.name ?? "",
    action: AUDIT_ACTIONS.KPI_CREATED,
    entity: "Kpi",
    entityId: String(kpi._id),
    meta: { name: kpi.name },
  });
  return ok({ kpi }, { status: 201 });
});
