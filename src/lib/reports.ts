import { connectDB } from "./db";
import { Invoice } from "@/models";
import {
  getLeaderboard,
  getBranchPerformance,
  getSupervisorPerformance,
  getCompanyMetrics,
} from "./kpi-engine";
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from "./constants";
import { formatDate, MONTH_NAMES } from "./utils";

export type ReportType =
  | "employee"
  | "supervisor"
  | "branch"
  | "company"
  | "leaderboard"
  | "invoice-approval";

export interface ReportColumn {
  key: string;
  label: string;
  type?: "currency" | "percent" | "number" | "text";
}

export interface ReportDataset {
  type: ReportType;
  title: string;
  period: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
}

const REPORT_TITLES: Record<ReportType, string> = {
  employee: "Employee Performance Report",
  supervisor: "Supervisor Performance Report",
  branch: "Branch Performance Report",
  company: "Company Performance Report",
  leaderboard: "Leaderboard Report",
  "invoice-approval": "Purchase Order Approval Report",
};

export async function buildReport(
  type: ReportType,
  month: number,
  year: number,
): Promise<ReportDataset> {
  await connectDB();
  const period = `${MONTH_NAMES[month - 1]} ${year}`;
  const base = { type, title: REPORT_TITLES[type], period };

  switch (type) {
    case "employee":
    case "leaderboard": {
      const board = await getLeaderboard(month, year);
      return {
        ...base,
        columns: [
          { key: "rank", label: "Rank", type: "number" },
          { key: "name", label: "Name", type: "text" },
          { key: "branchName", label: "Branch", type: "text" },
          { key: "target", label: "Target", type: "currency" },
          { key: "approved", label: "Approved", type: "currency" },
          { key: "pending", label: "Pending", type: "currency" },
          { key: "achievementPercent", label: "Achievement", type: "percent" },
          { key: "approvedCount", label: "Purchase Orders", type: "number" },
        ],
        rows: board.map((e, i) => ({ rank: i + 1, ...e })) as unknown as Record<
          string,
          unknown
        >[],
      };
    }
    case "supervisor": {
      const rows = await getSupervisorPerformance(month, year);
      return {
        ...base,
        columns: [
          { key: "name", label: "Supervisor", type: "text" },
          { key: "teamSize", label: "Team Size", type: "number" },
          { key: "target", label: "Team Target", type: "currency" },
          { key: "approved", label: "Approved", type: "currency" },
          { key: "achievementPercent", label: "Achievement", type: "percent" },
          { key: "pendingApprovals", label: "Pending", type: "number" },
        ],
        rows: rows as unknown as Record<string, unknown>[],
      };
    }
    case "branch": {
      const rows = await getBranchPerformance(month, year);
      return {
        ...base,
        columns: [
          { key: "name", label: "Branch", type: "text" },
          { key: "employeeCount", label: "Employees", type: "number" },
          { key: "target", label: "Target", type: "currency" },
          { key: "approved", label: "Approved", type: "currency" },
          { key: "achievementPercent", label: "Achievement", type: "percent" },
        ],
        rows: rows as unknown as Record<string, unknown>[],
      };
    }
    case "company": {
      const m = await getCompanyMetrics(month, year);
      return {
        ...base,
        columns: [
          { key: "metric", label: "Metric", type: "text" },
          { key: "value", label: "Value", type: "text" },
        ],
        rows: [
          { metric: "Total Target", value: m.totalTarget, _type: "currency" },
          { metric: "Total Approved", value: m.totalApproved, _type: "currency" },
          { metric: "Total Pending", value: m.totalPending, _type: "currency" },
          { metric: "Achievement %", value: m.achievementPercent, _type: "percent" },
          { metric: "Active Sales Personnel", value: m.employeeCount },
          { metric: "Approved Purchase Orders", value: m.approvedInvoiceCount },
          { metric: "Pending Purchase Orders", value: m.pendingInvoiceCount },
        ],
      };
    }
    case "invoice-approval": {
      const invoices = await Invoice.find({ month, year })
        .populate("employeeId", "firstName lastName")
        .populate("supervisorId", "firstName lastName")
        .sort({ createdAt: -1 })
        .lean();
      return {
        ...base,
        columns: [
          { key: "invoiceNumber", label: "PO #", type: "text" },
          { key: "employee", label: "Employee", type: "text" },
          { key: "customerName", label: "Customer", type: "text" },
          { key: "amount", label: "Amount", type: "currency" },
          { key: "status", label: "Status", type: "text" },
          { key: "supervisor", label: "Reviewed By", type: "text" },
          { key: "date", label: "Date", type: "text" },
        ],
        rows: invoices.map((inv) => {
          const emp = inv.employeeId as unknown as { firstName?: string; lastName?: string };
          const sup = inv.supervisorId as unknown as { firstName?: string; lastName?: string };
          return {
            invoiceNumber: inv.invoiceNumber,
            employee: emp ? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() : "—",
            customerName: inv.customerName,
            amount: inv.amount,
            status: INVOICE_STATUS_LABELS[inv.status as InvoiceStatus] ?? inv.status,
            supervisor: sup ? `${sup.firstName ?? ""} ${sup.lastName ?? ""}`.trim() : "—",
            date: formatDate(inv.invoiceDate as Date),
          };
        }),
      };
    }
  }
}
