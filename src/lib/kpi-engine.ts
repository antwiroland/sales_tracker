import { Types } from "mongoose";
import { connectDB } from "./db";
import { Invoice, KpiAssignment, User, Branch } from "@/models";
import { INVOICE_STATUS, ROLES } from "./constants";
import { forecast, type ForecastResult } from "./forecast";
import { clampPercent } from "./utils";

export interface SalesTotals {
  approved: number;
  pending: number;
  rejected: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
}

/** Sum invoice amounts by status for one employee in a period. */
export async function getEmployeeSales(
  employeeId: string | Types.ObjectId,
  month: number,
  year: number,
): Promise<SalesTotals> {
  await connectDB();
  const rows = await Invoice.aggregate<{
    _id: string;
    total: number;
    count: number;
  }>([
    { $match: { employeeId: new Types.ObjectId(String(employeeId)), month, year } },
    { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  const totals: SalesTotals = {
    approved: 0,
    pending: 0,
    rejected: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
  };
  for (const r of rows) {
    if (r._id === INVOICE_STATUS.APPROVED) {
      totals.approved = r.total;
      totals.approvedCount = r.count;
    } else if (r._id === INVOICE_STATUS.REJECTED) {
      totals.rejected = r.total;
      totals.rejectedCount = r.count;
    } else {
      // SUBMITTED / PENDING / DRAFT all count as "pending" for the dashboard.
      totals.pending += r.total;
      totals.pendingCount += r.count;
    }
  }
  return totals;
}

/** Total assigned target across all KPIs for an employee in a period. */
export async function getEmployeeTarget(
  employeeId: string | Types.ObjectId,
  month: number,
  year: number,
): Promise<number> {
  await connectDB();
  const rows = await KpiAssignment.aggregate<{ total: number }>([
    { $match: { employeeId: new Types.ObjectId(String(employeeId)), month, year } },
    { $group: { _id: null, total: { $sum: "$targetValue" } } },
  ]);
  return rows[0]?.total ?? 0;
}

export interface EmployeeKpiSummary {
  employeeId: string;
  name: string;
  email: string;
  role: string;
  position: string;
  branchId: string | null;
  branchName: string;
  photoUrl: string;
  target: number;
  approved: number;
  pending: number;
  rejected: number;
  approvedCount: number;
  achievementPercent: number;
  forecast: ForecastResult;
}

/** Full per-employee performance summary for a period. */
export async function getEmployeeSummary(
  employeeId: string | Types.ObjectId,
  month: number,
  year: number,
): Promise<EmployeeKpiSummary | null> {
  await connectDB();
  const user = await User.findById(employeeId)
    .populate("branchId", "name")
    .lean();
  if (!user) return null;

  const [sales, target] = await Promise.all([
    getEmployeeSales(employeeId, month, year),
    getEmployeeTarget(employeeId, month, year),
  ]);

  const achievementPercent = target > 0 ? (sales.approved / target) * 100 : 0;
  const branch = user.branchId as unknown as { _id: Types.ObjectId; name: string } | null;

  return {
    employeeId: String(user._id),
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role,
    position: user.position || "",
    branchId: branch ? String(branch._id) : null,
    branchName: branch?.name ?? "—",
    photoUrl: user.profilePhoto?.url ?? "",
    target,
    approved: sales.approved,
    pending: sales.pending,
    rejected: sales.rejected,
    approvedCount: sales.approvedCount,
    achievementPercent: clampPercent(achievementPercent),
    forecast: forecast({ currentSales: sales.approved, target, month, year }),
  };
}

/** Build leaderboard rows for all active sales personnel in a period. */
export async function getLeaderboard(
  month: number,
  year: number,
  opts: { branchId?: string } = {},
): Promise<EmployeeKpiSummary[]> {
  await connectDB();
  const filter: Record<string, unknown> = { role: ROLES.SALES, isActive: true };
  if (opts.branchId) filter.branchId = new Types.ObjectId(opts.branchId);

  const employees = await User.find(filter).select("_id").lean();
  const summaries = await Promise.all(
    employees.map((e) => getEmployeeSummary(String(e._id), month, year)),
  );

  return summaries
    .filter((s): s is EmployeeKpiSummary => s !== null)
    .sort((a, b) => b.approved - a.approved);
}

export interface CompanyMetrics {
  totalTarget: number;
  totalApproved: number;
  totalPending: number;
  achievementPercent: number;
  employeeCount: number;
  approvedInvoiceCount: number;
  pendingInvoiceCount: number;
}

export async function getCompanyMetrics(
  month: number,
  year: number,
): Promise<CompanyMetrics> {
  await connectDB();

  const [targetRows, invoiceRows, employeeCount] = await Promise.all([
    KpiAssignment.aggregate<{ total: number }>([
      { $match: { month, year } },
      { $group: { _id: null, total: { $sum: "$targetValue" } } },
    ]),
    Invoice.aggregate<{ _id: string; total: number; count: number }>([
      { $match: { month, year } },
      { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    User.countDocuments({ role: ROLES.SALES, isActive: true }),
  ]);

  const totalTarget = targetRows[0]?.total ?? 0;
  let totalApproved = 0;
  let totalPending = 0;
  let approvedInvoiceCount = 0;
  let pendingInvoiceCount = 0;
  for (const r of invoiceRows) {
    if (r._id === INVOICE_STATUS.APPROVED) {
      totalApproved = r.total;
      approvedInvoiceCount = r.count;
    } else if (r._id !== INVOICE_STATUS.REJECTED) {
      totalPending += r.total;
      pendingInvoiceCount += r.count;
    }
  }

  return {
    totalTarget,
    totalApproved,
    totalPending,
    achievementPercent: clampPercent(
      totalTarget > 0 ? (totalApproved / totalTarget) * 100 : 0,
    ),
    employeeCount,
    approvedInvoiceCount,
    pendingInvoiceCount,
  };
}

export interface BranchPerformance {
  branchId: string;
  name: string;
  target: number;
  approved: number;
  achievementPercent: number;
  employeeCount: number;
}

export async function getBranchPerformance(
  month: number,
  year: number,
): Promise<BranchPerformance[]> {
  await connectDB();
  const branches = await Branch.find({ isActive: true }).lean();
  const leaderboard = await getLeaderboard(month, year);

  const rows: BranchPerformance[] = branches.map((b) => {
    const members = leaderboard.filter((e) => e.branchId === String(b._id));
    const target = members.reduce((s, e) => s + e.target, 0);
    const approved = members.reduce((s, e) => s + e.approved, 0);
    return {
      branchId: String(b._id),
      name: b.name,
      target,
      approved,
      achievementPercent: clampPercent(target > 0 ? (approved / target) * 100 : 0),
      employeeCount: members.length,
    };
  });

  return rows.sort((a, b) => b.approved - a.approved);
}

export interface SupervisorPerformance {
  supervisorId: string;
  name: string;
  teamSize: number;
  target: number;
  approved: number;
  achievementPercent: number;
  pendingApprovals: number;
}

export async function getSupervisorPerformance(
  month: number,
  year: number,
): Promise<SupervisorPerformance[]> {
  await connectDB();
  const supervisors = await User.find({ role: ROLES.SUPERVISOR, isActive: true }).lean();

  const rows = await Promise.all(
    supervisors.map(async (sup) => {
      const team = await User.find({ supervisorId: sup._id, role: ROLES.SALES })
        .select("_id")
        .lean();
      const summaries = await Promise.all(
        team.map((t) => getEmployeeSummary(String(t._id), month, year)),
      );
      const valid = summaries.filter((s): s is EmployeeKpiSummary => s !== null);
      const target = valid.reduce((s, e) => s + e.target, 0);
      const approved = valid.reduce((s, e) => s + e.approved, 0);
      const pendingApprovals = await Invoice.countDocuments({
        supervisorId: sup._id,
        status: { $in: [INVOICE_STATUS.SUBMITTED, INVOICE_STATUS.PENDING] },
      });
      return {
        supervisorId: String(sup._id),
        name: `${sup.firstName} ${sup.lastName}`,
        teamSize: team.length,
        target,
        approved,
        achievementPercent: clampPercent(target > 0 ? (approved / target) * 100 : 0),
        pendingApprovals,
      };
    }),
  );

  return rows.sort((a, b) => b.approved - a.approved);
}

/** Daily approved-sales trend for a period (for charts). */
export async function getMonthlyTrend(
  month: number,
  year: number,
  employeeId?: string,
): Promise<{ day: number; approved: number }[]> {
  await connectDB();
  const match: Record<string, unknown> = {
    month,
    year,
    status: INVOICE_STATUS.APPROVED,
  };
  if (employeeId) match.employeeId = new Types.ObjectId(employeeId);

  const rows = await Invoice.aggregate<{ _id: number; total: number }>([
    { $match: match },
    { $group: { _id: { $dayOfMonth: "$invoiceDate" }, total: { $sum: "$amount" } } },
    { $sort: { _id: 1 } },
  ]);

  return rows.map((r) => ({ day: r._id, approved: r.total }));
}
