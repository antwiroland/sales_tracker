import Link from "next/link";
import {
  Target,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Trophy,
  CalendarClock,
  FilePlus2,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models";
import { getEmployeeSummary, getLeaderboard, getMonthlyTrend } from "@/lib/kpi-engine";
import { currentMonthYear, formatCurrency, formatPercent, formatDate } from "@/lib/utils";
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/lib/constants";
import { PageHeader, StatCard, Card, ProgressBar, Badge, EmptyState } from "@/components/ui";
import { HealthBadge, healthBarClass } from "@/components/HealthBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { TrendChart } from "@/components/Charts";

function statusColor(s: InvoiceStatus) {
  return s === "APPROVED"
    ? "green"
    : s === "REJECTED"
      ? "red"
      : s === "DRAFT"
        ? "slate"
        : "amber";
}

export default async function SalesDashboard() {
  const user = await getCurrentUser();
  const { month, year } = currentMonthYear();

  const [summary, board, trend] = await Promise.all([
    getEmployeeSummary(user.id, month, year),
    getLeaderboard(month, year),
    getMonthlyTrend(month, year, user.id),
  ]);

  await connectDB();
  const recent = await Invoice.find({ employeeId: user.id })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  const rank = board.findIndex((e) => e.employeeId === user.id) + 1;
  const nextUp = rank > 1 ? board[rank - 2] : null;
  const f = summary?.forecast;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name?.split(" ")[0] ?? "there"}`}
        subtitle="Your KPI performance for this month"
        action={
          <Link href="/dashboard/invoices/new" className="btn-primary">
            <FilePlus2 size={16} /> New Purchase Order
          </Link>
        }
      />

      {!summary || summary.target === 0 ? (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            You have no KPI target assigned for this month yet. Your manager will assign
            one soon. You can still submit purchase orders below.
          </p>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="KPI Target"
          value={formatCurrency(summary?.target ?? 0)}
          icon={<Target size={18} />}
          accent="brand"
        />
        <StatCard
          label="Approved Sales"
          value={formatCurrency(summary?.approved ?? 0)}
          hint={`${summary?.approvedCount ?? 0} purchase orders`}
          icon={<CheckCircle2 size={18} />}
          accent="green"
        />
        <StatCard
          label="Pending Sales"
          value={formatCurrency(summary?.pending ?? 0)}
          icon={<Clock size={18} />}
          accent="amber"
        />
        <StatCard
          label="Rejected"
          value={formatCurrency(summary?.rejected ?? 0)}
          icon={<XCircle size={18} />}
          accent="red"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Achievement + forecast */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Achievement</h2>
            {f && <HealthBadge health={f.health} />}
          </div>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-bold text-slate-900">
              {formatPercent(summary?.achievementPercent ?? 0)}
            </p>
            <p className="text-sm text-slate-500">
              {formatCurrency(summary?.approved ?? 0)} / {formatCurrency(summary?.target ?? 0)}
            </p>
          </div>
          <div className="mt-3">
            <ProgressBar
              percent={summary?.achievementPercent ?? 0}
              color={f ? healthBarClass(f.health) : undefined}
            />
          </div>

          {f && (
            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs text-slate-500">Forecast (month-end)</p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  {formatCurrency(f.projectedSales)}
                </p>
                <p className="text-xs text-slate-400">
                  Expected {formatPercent(f.expectedKpiPercent)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Required / day</p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  {formatCurrency(f.requiredDailySales)}
                </p>
                <p className="text-xs text-slate-400">{f.remainingDays} days left</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Daily average</p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  {formatCurrency(f.dailyAverage)}
                </p>
                <p className="text-xs text-slate-400">over {f.elapsedDays} days</p>
              </div>
            </div>
          )}
        </Card>

        {/* Rank + countdown */}
        <div className="space-y-6">
          <Card>
            <div className="mb-2 flex items-center gap-2 text-slate-800">
              <Trophy size={18} className="text-amber-500" />
              <h2 className="font-semibold">Your Rank</h2>
            </div>
            <p className="text-4xl font-bold text-slate-900">
              {rank > 0 ? `#${rank}` : "—"}
            </p>
            <p className="mt-1 text-sm text-slate-500">of {board.length} sales personnel</p>
            {nextUp && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Need{" "}
                <span className="font-semibold text-brand-600">
                  {formatCurrency(Math.max(nextUp.approved - (summary?.approved ?? 0), 0) + 1)}
                </span>{" "}
                to reach #{rank - 1}
              </p>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2 text-slate-800">
              <CalendarClock size={18} className="text-brand-600" />
              <h2 className="font-semibold">Month Ends In</h2>
            </div>
            <CountdownTimer />
          </Card>
        </div>
      </div>

      {/* Trend + recent invoices */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2 text-slate-800">
            <TrendingUp size={18} className="text-brand-600" />
            <h2 className="font-semibold">Approved Sales Trend</h2>
          </div>
          {trend.length > 0 ? (
            <TrendChart data={trend} />
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">
              No approved sales yet this month.
            </p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Purchase Orders</h2>
            <Link href="/dashboard/invoices" className="text-xs text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState title="No purchase orders yet" message="Submit your first purchase order." />
          ) : (
            <ul className="space-y-3">
              {recent.map((inv) => (
                <li key={String(inv._id)} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {inv.customerName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {inv.invoiceNumber} · {formatDate(inv.invoiceDate as Date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      {formatCurrency(inv.amount)}
                    </p>
                    <Badge color={statusColor(inv.status as InvoiceStatus)}>
                      {INVOICE_STATUS_LABELS[inv.status as InvoiceStatus]}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
