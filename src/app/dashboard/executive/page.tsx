import { Target, CheckCircle2, Percent, TrendingDown } from "lucide-react";
import { requirePage } from "@/lib/session";
import {
  getCompanyMetrics,
  getBranchPerformance,
  getSupervisorPerformance,
  getLeaderboard,
} from "@/lib/kpi-engine";
import { forecast } from "@/lib/forecast";
import { currentMonthYear, formatCurrency, formatPercent } from "@/lib/utils";
import { PageHeader, StatCard, Card, Table, Th, Td } from "@/components/ui";
import { CountdownTimer } from "@/components/CountdownTimer";
import { HealthBadge } from "@/components/HealthBadge";

function RankList({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; sub: string; value: string }[];
}) {
  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-800">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">No data</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{r.name}</p>
                  <p className="truncate text-xs text-slate-400">{r.sub}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-700">{r.value}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default async function ExecutiveDashboard() {
  await requirePage("dashboard.executive");
  const { month, year } = currentMonthYear();

  const [company, branches, supervisors, board] = await Promise.all([
    getCompanyMetrics(month, year),
    getBranchPerformance(month, year),
    getSupervisorPerformance(month, year),
    getLeaderboard(month, year),
  ]);

  const f = forecast({
    currentSales: company.totalApproved,
    target: company.totalTarget,
    month,
    year,
  });

  const bottom = [...board].filter((e) => e.target > 0).reverse().slice(0, 5);

  return (
    <>
      <PageHeader
        title="Executive Dashboard"
        subtitle="High-level company performance overview"
        action={
          <div className="hidden md:block">
            <CountdownTimer />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Target" value={formatCurrency(company.totalTarget)} icon={<Target size={18} />} accent="brand" />
        <StatCard label="Total Achieved" value={formatCurrency(company.totalApproved)} icon={<CheckCircle2 size={18} />} accent="green" />
        <StatCard label="Achievement %" value={formatPercent(company.achievementPercent)} icon={<Percent size={18} />} accent="amber" />
        <StatCard
          label="Forecast (EOM)"
          value={formatCurrency(f.projectedSales)}
          hint={<HealthBadge health={f.health} />}
          icon={<TrendingDown size={18} />}
          accent="slate"
        />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <RankList
          title="Top Branches"
          rows={branches.slice(0, 5).map((b) => ({
            name: b.name,
            sub: `${b.employeeCount} staff · ${formatPercent(b.achievementPercent)}`,
            value: formatCurrency(b.approved),
          }))}
        />
        <RankList
          title="Top Supervisors"
          rows={supervisors.slice(0, 5).map((s) => ({
            name: s.name,
            sub: `${s.teamSize} team · ${formatPercent(s.achievementPercent)}`,
            value: formatCurrency(s.approved),
          }))}
        />
        <RankList
          title="Top Sales Personnel"
          rows={board.slice(0, 5).map((e) => ({
            name: e.name,
            sub: `${e.branchName} · ${formatPercent(e.achievementPercent)}`,
            value: formatCurrency(e.approved),
          }))}
        />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
          <TrendingDown size={18} className="text-red-500" />
          Bottom Performers — Requiring Attention
        </h2>
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Branch</Th>
              <Th>Target</Th>
              <Th>Approved</Th>
              <Th>Achievement</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {bottom.map((e) => (
              <tr key={e.employeeId}>
                <Td className="font-medium text-slate-800">{e.name}</Td>
                <Td>{e.branchName}</Td>
                <Td>{formatCurrency(e.target)}</Td>
                <Td>{formatCurrency(e.approved)}</Td>
                <Td>{formatPercent(e.achievementPercent)}</Td>
                <Td>
                  <HealthBadge health={e.forecast.health} />
                </Td>
              </tr>
            ))}
            {bottom.length === 0 && (
              <tr>
                <Td className="text-slate-400">No data</Td>
                <Td /><Td /><Td /><Td /><Td />
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );
}
