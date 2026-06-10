import { z } from "zod";
import { connectDB } from "@/lib/db";
import { KpiAssignment, User, Kpi } from "@/models";
import { ok, route, requirePermission, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { AUDIT_ACTIONS, NOTIFICATION_TYPES } from "@/lib/constants";

const schema = z.object({
  employeeId: z.string().min(1),
  kpiId: z.string().min(1),
  targetValue: z.number().min(0),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(3000),
  notes: z.string().optional(),
});

export const GET = route(async (req: Request) => {
  await requirePermission("kpi.assign");
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter: Record<string, unknown> = {};
  if (searchParams.get("month")) filter.month = Number(searchParams.get("month"));
  if (searchParams.get("year")) filter.year = Number(searchParams.get("year"));
  if (searchParams.get("employeeId")) filter.employeeId = searchParams.get("employeeId");

  const assignments = await KpiAssignment.find(filter)
    .populate("employeeId", "firstName lastName email")
    .populate("kpiId", "name unit")
    .sort({ createdAt: -1 })
    .lean();
  return ok({ assignments });
});

export const POST = route(async (req: Request) => {
  const actor = await requirePermission("kpi.assign");
  await connectDB();
  const body = schema.parse(await req.json());

  const [employee, kpi] = await Promise.all([
    User.findById(body.employeeId).lean(),
    Kpi.findById(body.kpiId).lean(),
  ]);
  if (!employee) throw new ApiError(404, "Employee not found");
  if (!kpi) throw new ApiError(404, "KPI not found");

  // Upsert so re-assigning the same period updates the target.
  const assignment = await KpiAssignment.findOneAndUpdate(
    {
      employeeId: body.employeeId,
      kpiId: body.kpiId,
      month: body.month,
      year: body.year,
    },
    {
      targetValue: body.targetValue,
      notes: body.notes ?? "",
      assignedBy: actor.id,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await audit({
    actorId: actor.id,
    actorName: actor.name ?? "",
    action: AUDIT_ACTIONS.KPI_ASSIGNED,
    entity: "KpiAssignment",
    entityId: String(assignment._id),
    meta: { employeeId: body.employeeId, kpiId: body.kpiId, target: body.targetValue },
  });

  await notify({
    userId: body.employeeId,
    type: NOTIFICATION_TYPES.KPI_ASSIGNED,
    title: "New KPI assigned",
    message: `You have a ${kpi.name} target for ${body.month}/${body.year}.`,
    link: "/dashboard/sales",
  });

  return ok({ assignment }, { status: 201 });
});
