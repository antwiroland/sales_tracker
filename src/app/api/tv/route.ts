import { ok, route, requireUser } from "@/lib/api";
import {
  getLeaderboard,
  getCompanyMetrics,
  getBranchPerformance,
} from "@/lib/kpi-engine";
import { currentMonthYear } from "@/lib/utils";

/** Aggregated payload for the auto-rotating TV display. */
export const GET = route(async () => {
  await requireUser();
  const { month, year } = currentMonthYear();

  const [company, leaderboard, branches] = await Promise.all([
    getCompanyMetrics(month, year),
    getLeaderboard(month, year),
    getBranchPerformance(month, year),
  ]);

  return ok({ month, year, company, leaderboard, branches });
});
