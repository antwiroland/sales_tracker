import { z } from "zod";
import { connectDB } from "@/lib/db";
import { KpiAssignment, User, Kpi } from "@/models";
import { ok, route, requirePermission, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { notifyMany } from "@/lib/notifications";
import { AUDIT_ACTIONS, NOTIFICATION_TYPES } from "@/lib/constants";

/**
 * Bulk KPI assignment. Accepts either:
 *  - a list of employeeIds + a single kpiId/target/period (apply-to-many), or
 *  - an explicit `rows` array (e.g. parsed from an uploaded Excel sheet).
 */
const schema = z.object({
  kpiId: z.string().optional(),
  targetValue: z.number().min(0).optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(3000),
  employeeIds: z.array(z.string()).optional(),
  rows: z
    .array(
      z.object({
        employeeId: z.string(),
        kpiId: z.string(),
        targetValue: z.number().min(0),
      }),
    )
    .optional(),
});

export const POST = route(async (req: Request) => {
  const actor = await requirePermission("kpi.assign.bulk");
  await connectDB();
  const body = schema.parse(await req.json());

  // Normalise everything into a flat list of assignment rows.
  let rows: { employeeId: string; kpiId: string; targetValue: number }[] = [];
  if (body.rows && body.rows.length) {
    rows = body.rows;
  } else if (body.employeeIds && body.kpiId && body.targetValue != null) {
    rows = body.employeeIds.map((employeeId) => ({
      employeeId,
      kpiId: body.kpiId!,
      targetValue: body.targetValue!,
    }));
  } else {
    throw new ApiError(422, "Provide either rows[] or employeeIds + kpiId + targetValue");
  }
  if (rows.length === 0) throw new ApiError(422, "No assignments provided");

  // Validate referenced KPIs exist.
  const kpiIds = [...new Set(rows.map((r) => r.kpiId))];
  const kpiCount = await Kpi.countDocuments({ _id: { $in: kpiIds } });
  if (kpiCount !== kpiIds.length) throw new ApiError(404, "One or more KPIs not found");

  const ops = rows.map((r) => ({
    updateOne: {
      filter: {
        employeeId: r.employeeId,
        kpiId: r.kpiId,
        month: body.month,
        year: body.year,
      },
      update: {
        $set: { targetValue: r.targetValue, assignedBy: actor.id },
        $setOnInsert: {
          employeeId: r.employeeId,
          kpiId: r.kpiId,
          month: body.month,
          year: body.year,
        },
      },
      upsert: true,
    },
  }));

  const result = await KpiAssignment.bulkWrite(
    ops as Parameters<typeof KpiAssignment.bulkWrite>[0],
  );

  await audit({
    actorId: actor.id,
    actorName: actor.name ?? "",
    action: AUDIT_ACTIONS.KPI_BULK_ASSIGNED,
    entity: "KpiAssignment",
    meta: { count: rows.length, month: body.month, year: body.year },
  });

  const uniqueEmployees = [...new Set(rows.map((r) => r.employeeId))];
  await notifyMany(
    uniqueEmployees.map((employeeId) => ({
      userId: employeeId,
      type: NOTIFICATION_TYPES.KPI_ASSIGNED,
      title: "New KPI assigned",
      message: `A KPI target was set for ${body.month}/${body.year}.`,
      link: "/dashboard/sales",
    })),
  );

  return ok(
    {
      processed: rows.length,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
    },
    { status: 201 },
  );
});
