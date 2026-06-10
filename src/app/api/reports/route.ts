import { ok, route, requirePermission, ApiError } from "@/lib/api";
import { buildReport, type ReportType } from "@/lib/reports";
import { audit } from "@/lib/audit";
import { currentMonthYear } from "@/lib/utils";
import { AUDIT_ACTIONS } from "@/lib/constants";

const VALID: ReportType[] = [
  "employee",
  "supervisor",
  "branch",
  "company",
  "leaderboard",
  "invoice-approval",
];

export const GET = route(async (req: Request) => {
  const actor = await requirePermission("reports.view");
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as ReportType;
  if (!VALID.includes(type)) throw new ApiError(422, "Invalid report type");

  const now = currentMonthYear();
  const month = Number(searchParams.get("month")) || now.month;
  const year = Number(searchParams.get("year")) || now.year;

  const dataset = await buildReport(type, month, year);

  await audit({
    actorId: actor.id,
    actorName: actor.name ?? "",
    action: AUDIT_ACTIONS.REPORT_GENERATED,
    entity: "Report",
    meta: { type, month, year },
  });

  return ok(dataset);
});
