import { Target, CheckCircle2, Percent, Clock } from "lucide-react";
import { requirePage } from "@/lib/session";
import {
  getCompanyMetrics,
  getBranchPerformance,
  getSupervisorPerformance,
  getLeaderboard,
} from "@/lib/kpi-engine";
import { forecast } from "@/lib/forecast";
import { currentMonthYear, formatCurrency, formatPercent } from "@/lib/utils";
import { PageHeader, StatCard, Card, ProgressBar, Table, Th, Td } from "@/components/ui";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ComparisonChart } from "@/components/Charts";
import { HealthBadge } from "@/components/HealthBadge";

export default async function ManagerDashboard() {
  const user = await requirePage("dashboard.manager");
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

  const topPerformers = board.slice(0, 5);

  return (
    <>
      <PageHeader
        title={`Company Dashboard`}
        subtitle="Company-wide KPI performance and rankings"
        action={
          <div className="hidden md:block">
            <CountdownTimer />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Company Target" value={formatCurrency(company.totalTarget)} icon={<Target size={18} />} accent="brand" />
        <StatCard label="Company Achieved" value={formatCurrency(company.totalApproved)} icon={<CheckCircle2 size={18} />} accent="green" />
        <StatCard label="Achievement %" value={formatPercent(company.achievementPercent)} icon={<Percent size={18} />} accent="amber" />
        <StatCard label="Pending Approvals" value={company.pendingInvoiceCount} hint={formatCurrency(company.totalPending)} icon={<Clock size={18} />} accent="slate" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-800">Branch Performance</h2>
          {branches.length > 0 ? (
            <ComparisonChart
              data={branches.map((b) => ({
                name: b.name,
                approved: b.approved,
                achievementPercent: b.achievementPercent,
              }))}
              colorByPercent
            />
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No branch data.</p>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Company Forecast</h2>
            <HealthBadge health={f.health} />
          </div>
          <p className="text-xs text-slate-500">Projected month-end</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {formatCurrency(f.projectedSales)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Expected {formatPercent(f.expectedKpiPercent)} of target
          </p>
          <div className="mt-3">
            <ProgressBar percent={f.expectedKpiPercent} />
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 md:hidden">
            <CountdownTimer />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Supervisor ranking */}
        <div>
          <h2 className="mb-3 font-semibold text-slate-800">Supervisor Ranking</h2>
          <Table>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Supervisor</Th>
                <Th>Team</Th>
                <Th>Approved</Th>
                <Th>Achievement</Th>
              </tr>
            </thead>
            <tbody>
              {supervisors.map((s, i) => (
                <tr key={s.supervisorId}>
                  <Td className="font-semibold text-slate-400">{i + 1}</Td>
                  <Td className="font-medium text-slate-800">{s.name}</Td>
                  <Td>{s.teamSize}</Td>
                  <Td>{formatCurrency(s.approved)}</Td>
                  <Td>{formatPercent(s.achievementPercent)}</Td>
                </tr>
              ))}
              {supervisors.length === 0 && (
                <tr>
                  <Td className="text-slate-400">—</Td>
                  <Td>No supervisors</Td>
                  <Td /><Td /><Td />
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Top performers */}
        <div>
          <h2 className="mb-3 font-semibold text-slate-800">Top Performers</h2>
          <Table>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Name</Th>
                <Th>Branch</Th>
                <Th>Approved</Th>
                <Th>%</Th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((e, i) => (
                <tr key={e.employeeId}>
                  <Td className="font-semibold text-slate-400">{i + 1}</Td>
                  <Td className="font-medium text-slate-800">{e.name}</Td>
                  <Td>{e.branchName}</Td>
                  <Td>{formatCurrency(e.approved)}</Td>
                  <Td>{formatPercent(e.achievementPercent)}</Td>
                </tr>
              ))}
              {topPerformers.length === 0 && (
                <tr>
                  <Td className="text-slate-400">—</Td>
                  <Td>No data</Td>
                  <Td /><Td /><Td />
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </>
  );
}
