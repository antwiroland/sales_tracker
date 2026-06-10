import { Clock, CheckCircle2, XCircle, Users } from "lucide-react";
import { requirePage } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Invoice, User } from "@/models";
import { getEmployeeSummary } from "@/lib/kpi-engine";
import {
  currentMonthYear,
  formatCurrency,
  formatPercent,
  clampPercent,
} from "@/lib/utils";
import { INVOICE_STATUS } from "@/lib/constants";
import { PageHeader, StatCard, Card, ProgressBar, Table, Th, Td } from "@/components/ui";
import { ApprovalQueue } from "@/components/ApprovalQueue";

export default async function SupervisorDashboard() {
  const user = await requirePage("dashboard.supervisor");
  const { month, year } = currentMonthYear();
  await connectDB();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [pending, approvedToday, rejectedToday, team] = await Promise.all([
    Invoice.countDocuments({
      supervisorId: user.id,
      status: { $in: [INVOICE_STATUS.SUBMITTED, INVOICE_STATUS.PENDING] },
    }),
    Invoice.countDocuments({
      supervisorId: user.id,
      status: INVOICE_STATUS.APPROVED,
      approvalDate: { $gte: startOfToday },
    }),
    Invoice.countDocuments({
      supervisorId: user.id,
      status: INVOICE_STATUS.REJECTED,
      approvalDate: { $gte: startOfToday },
    }),
    User.find({ supervisorId: user.id, role: "SALES" }).select("_id").lean(),
  ]);

  const summaries = (
    await Promise.all(team.map((t) => getEmployeeSummary(String(t._id), month, year)))
  ).filter((s) => s !== null);

  const teamTarget = summaries.reduce((s, e) => s + e!.target, 0);
  const teamApproved = summaries.reduce((s, e) => s + e!.approved, 0);
  const teamAchievement = clampPercent(
    teamTarget > 0 ? (teamApproved / teamTarget) * 100 : 0,
  );

  return (
    <>
      <PageHeader
        title="Supervisor Dashboard"
        subtitle="Review submissions and track your team"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending Approvals" value={pending} icon={<Clock size={18} />} accent="amber" />
        <StatCard label="Approved Today" value={approvedToday} icon={<CheckCircle2 size={18} />} accent="green" />
        <StatCard label="Rejected Today" value={rejectedToday} icon={<XCircle size={18} />} accent="red" />
        <StatCard label="Team Size" value={team.length} icon={<Users size={18} />} accent="brand" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-semibold text-slate-800">Approval Queue</h2>
          <ApprovalQueue />
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold text-slate-800">Team Achievement</h2>
            <p className="text-3xl font-bold text-slate-900">
              {formatPercent(teamAchievement)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {formatCurrency(teamApproved)} / {formatCurrency(teamTarget)}
            </p>
            <div className="mt-3">
              <ProgressBar percent={teamAchievement} />
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-semibold text-slate-800">Team Performance</h2>
        {summaries.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">No sales personnel report to you yet.</p>
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Employee</Th>
                <Th>Target</Th>
                <Th>Approved</Th>
                <Th>Pending</Th>
                <Th>Achievement</Th>
              </tr>
            </thead>
            <tbody>
              {summaries
                .sort((a, b) => b!.approved - a!.approved)
                .map((e) => (
                  <tr key={e!.employeeId}>
                    <Td className="font-medium text-slate-800">{e!.name}</Td>
                    <Td>{formatCurrency(e!.target)}</Td>
                    <Td className="text-emerald-600">{formatCurrency(e!.approved)}</Td>
                    <Td className="text-amber-600">{formatCurrency(e!.pending)}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <ProgressBar percent={e!.achievementPercent} />
                        </div>
                        <span className="text-xs font-medium text-slate-600">
                          {formatPercent(e!.achievementPercent)}
                        </span>
                      </div>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </Table>
        )}
      </div>
    </>
  );
}
