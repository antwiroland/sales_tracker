/**
 * One-off — adds (or resets) the demo Sales Manager account without wiping data.
 *   npx tsx scripts/add-sales-manager.ts
 */
import { existsSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

const envPath = path.resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) process.loadEnvFile(envPath);

import { connectDB } from "@/lib/db";
import { User, Branch } from "@/models";
import { ROLES } from "@/lib/constants";

const EMAIL = "salesmanager@demo.com";
const PASSWORD = process.env.SEED_PASSWORD || "Password123!";

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("\n✗ MONGODB_URI is not set in .env.local.\n");
    process.exit(1);
  }

  await connectDB();
  const hash = await bcrypt.hash(PASSWORD, 10);
  const branch = await Branch.findOne({}).sort({ name: 1 }).lean();

  const existing = await User.findOne({ email: EMAIL });
  if (existing) {
    existing.role = ROLES.SALES_MANAGER;
    existing.password = hash;
    existing.isActive = true;
    if (branch) existing.set("branchId", branch._id);
    await existing.save();
    console.log(`✓ Updated existing user ${EMAIL} (role=SALES_MANAGER, password reset)`);
  } else {
    await User.create({
      firstName: "Nana",
      lastName: "Asante",
      email: EMAIL,
      password: hash,
      role: ROLES.SALES_MANAGER,
      position: "Sales Manager",
      branchId: branch?._id,
      isActive: true,
    });
    console.log(`✓ Created ${EMAIL}`);
  }

  console.log(`  Password: ${PASSWORD}`);
  await (await connectDB()).disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
