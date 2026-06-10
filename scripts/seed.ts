/**
 * Seed script — populates the database with demo data.
 *   npm run seed
 *
 * Loads env from .env.local, wipes the core collections, and creates a small
 * but complete org: branches, KPIs, users for every role, assignments, and a
 * spread of invoices (approved / pending / rejected) for the current month.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

// Load env before anything reads process.env / connects.
const envPath = path.resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  // Node >= 20.12
  process.loadEnvFile(envPath);
}

import { connectDB } from "@/lib/db";
import {
  User,
  Branch,
  Kpi,
  KpiAssignment,
  Invoice,
  Notification,
  AuditLog,
} from "@/models";
import { ROLES, INVOICE_STATUS } from "@/lib/constants";
import { currentMonthYear, daysInMonth } from "@/lib/utils";

const PASSWORD = process.env.SEED_PASSWORD || "Password123!";

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("\n✗ MONGODB_URI is not set in .env.local. Add your connection string first.\n");
    process.exit(1);
  }

  console.log("Connecting to MongoDB…");
  await connectDB();

  console.log("Clearing existing data…");
  await Promise.all([
    User.deleteMany({}),
    Branch.deleteMany({}),
    Kpi.deleteMany({}),
    KpiAssignment.deleteMany({}),
    Invoice.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  const hash = await bcrypt.hash(PASSWORD, 10);
  const { month, year } = currentMonthYear();
  const dim = daysInMonth(month, year);

  // ----- Branches -----
  const branchNames = [
    { name: "Lagos HQ", code: "LAG", location: "Lagos" },
    { name: "Abuja Branch", code: "ABJ", location: "Abuja" },
    { name: "Port Harcourt", code: "PHC", location: "Rivers" },
  ];
  const branches = await Branch.insertMany(branchNames);
  console.log(`✓ ${branches.length} branches`);

  // ----- KPIs -----
  const kpis = await Kpi.insertMany([
    { name: "Monthly Revenue", description: "Total approved sales revenue", unit: "currency", weight: 3 },
    { name: "New Customers", description: "Invoices from new customers", unit: "count", weight: 1 },
    { name: "Premium Sales", description: "High-value product sales", unit: "currency", weight: 2 },
  ]);
  console.log(`✓ ${kpis.length} KPIs`);

  // ----- Core staff -----
  const admin = await User.create({
    firstName: "System", lastName: "Admin", email: "admin@demo.com",
    password: hash, role: ROLES.ADMIN, position: "Administrator",
  });
  const manager = await User.create({
    firstName: "Maya", lastName: "Manager", email: "manager@demo.com",
    password: hash, role: ROLES.MANAGER, position: "Sales Manager", branchId: branches[0]._id,
  });
  await User.create({
    firstName: "Eli", lastName: "Executive", email: "exec@demo.com",
    password: hash, role: ROLES.EXECUTIVE, position: "Chief Sales Officer",
  });

  // Set branch managers.
  await Branch.updateMany({}, { managerId: manager._id });

  const firstNames = ["Ada", "Tunde", "Chioma", "Bola", "Emeka", "Ngozi", "Yusuf", "Funke", "Ibrahim", "Zainab", "Kunle", "Amaka"];
  const lastNames = ["Okafor", "Adeyemi", "Bello", "Eze", "Okonkwo", "Lawal", "Nwosu", "Ade", "Musa", "Ojo"];

  const customers = ["Acme Ltd", "Globex", "Initech", "Umbrella Co", "Stark Inc", "Wayne Ent", "Soylent", "Hooli", "Pied Piper", "Vandelay"];

  let invoiceCount = 0;
  let assignmentCount = 0;
  const today = new Date();
  const maxDay = Math.min(dim, today.getMonth() + 1 === month && today.getFullYear() === year ? today.getDate() : dim);

  // One supervisor per branch.
  const supervisors = await Promise.all(
    branches.map((branch, b) =>
      User.create({
        firstName: firstNames[b % firstNames.length],
        lastName: lastNames[b % lastNames.length],
        email: `supervisor${b + 1}@demo.com`,
        password: hash,
        role: ROLES.SUPERVISOR,
        position: "Team Supervisor",
        branchId: branch._id,
      }),
    ),
  );
  console.log(`✓ ${supervisors.length} supervisors`);

  // Exactly 10 sales personnel, distributed across branches round-robin, with a
  // spread of performance profiles so dashboards/leaderboards have variety.
  const SALES_TOTAL = 10;
  // Performance bias per person: how likely their invoices are approved & how big.
  const profiles = [0.95, 0.85, 0.8, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.35];

  for (let n = 0; n < SALES_TOTAL; n++) {
    const branchIdx = n % branches.length;
    const branch = branches[branchIdx];
    const supervisor = supervisors[branchIdx];
    const approveBias = profiles[n];

    const sales = await User.create({
      firstName: firstNames[n % firstNames.length],
      lastName: lastNames[(n + 3) % lastNames.length],
      email: `sales${n + 1}@demo.com`,
      password: hash,
      role: ROLES.SALES,
      position: "Sales Executive",
      branchId: branch._id,
      supervisorId: supervisor._id,
    });

    // Primary revenue KPI target — sized so achievement lands in a realistic
    // spread (roughly 30%–140%) given the invoice volume below.
    const target = rand(24, 40) * 100_000; // 2.4M – 4.0M
    await KpiAssignment.create({
      employeeId: sales._id,
      kpiId: kpis[0]._id,
      targetValue: target,
      month,
      year,
      assignedBy: manager._id,
    });
    assignmentCount++;

    // Invoices spread across the elapsed part of the month with mixed statuses.
    const numInvoices = rand(5, 10);
    for (let i = 0; i < numInvoices; i++) {
      const day = rand(1, maxDay);
      const amount = rand(3, 12) * 50_000; // 150k – 600k
      const roll = Math.random();
      const status =
        roll < approveBias
          ? INVOICE_STATUS.APPROVED
          : roll < approveBias + 0.18
            ? INVOICE_STATUS.SUBMITTED
            : INVOICE_STATUS.REJECTED;

      await Invoice.create({
        invoiceNumber: `INV-${branch.code}-${n + 1}${i}${rand(100, 999)}`,
        employeeId: sales._id,
        branchId: branch._id,
        supervisorId: supervisor._id,
        kpiId: kpis[0]._id,
        customerName: pick(customers),
        amount,
        description: "Product sale",
        invoiceDate: new Date(year, month - 1, day, 10, 0, 0),
        status,
        approvalDate:
          status === INVOICE_STATUS.APPROVED || status === INVOICE_STATUS.REJECTED
            ? new Date(year, month - 1, day, 14, 0, 0)
            : undefined,
        rejectionReason: status === INVOICE_STATUS.REJECTED ? "Missing documentation" : "",
        month,
        year,
      });
      invoiceCount++;
    }
  }

  console.log(`✓ ${SALES_TOTAL} sales personnel, ${assignmentCount} KPI assignments`);
  console.log(`✓ ${invoiceCount} invoices`);

  console.log("\n────────────────────────────────────────");
  console.log("  Demo accounts (password for all below):");
  console.log(`  ${PASSWORD}`);
  console.log("────────────────────────────────────────");
  console.log("  Admin       admin@demo.com");
  console.log("  Manager     manager@demo.com");
  console.log("  Executive   exec@demo.com");
  console.log("  Supervisor  supervisor1@demo.com  (…2, …3)");
  console.log("  Sales       sales1@demo.com       (…2, …3, …)");
  console.log("────────────────────────────────────────\n");

  await (await connectDB()).disconnect();
  console.log("Done. ✨");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
