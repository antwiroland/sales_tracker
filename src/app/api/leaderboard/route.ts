import { ok, route, requireUser } from "@/lib/api";
import { getLeaderboard } from "@/lib/kpi-engine";
import { currentMonthYear } from "@/lib/utils";

export const GET = route(async (req: Request) => {
  await requireUser();
  const { searchParams } = new URL(req.url);
  const now = currentMonthYear();
  const month = Number(searchParams.get("month")) || now.month;
  const year = Number(searchParams.get("year")) || now.year;
  const branchId = searchParams.get("branchId") || undefined;

  const board = await getLeaderboard(month, year, { branchId });
  return ok({ month, year, leaderboard: board });
});
