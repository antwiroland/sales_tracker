/**
 * One-off migration — renames the existing branches to the generic demo layout
 * (Head Office, North Branch, East Branch) without touching users / purchase orders.
 *   npx tsx scripts/update-branches.ts
 *
 * Idempotent: matches old branches by previous name or code; any remaining
 * branches are renamed positionally by creation order.
 */
import { existsSync } from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) process.loadEnvFile(envPath);

import { connectDB } from "@/lib/db";
import { Branch } from "@/models";

const TARGETS = [
  { name: "Head Office", code: "HQ", location: "Central" },
  { name: "North Branch", code: "NTH", location: "North" },
  { name: "East Branch", code: "EST", location: "East" },
];

// Old name/code -> target index.
const ALIASES: Record<string, number> = {
  "Head Office": 0, HQ: 0, "Spintex HQ": 0, SPX: 0, "Accra HQ": 0, ACC: 0,
  "North Branch": 1, NTH: 1, Westlands: 1, WST: 1, "Kumasi Branch": 1, KUM: 1,
  "East Branch": 2, EST: 2, Tema: 2, TMA: 2, "Takoradi Branch": 2, TAK: 2,
};

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("\n✗ MONGODB_URI is not set in .env.local.\n");
    process.exit(1);
  }

  await connectDB();
  const branches = await Branch.find({}).sort({ createdAt: 1 });

  if (branches.length === 0) {
    // No branches yet — create the three.
    await Branch.insertMany(TARGETS);
    console.log("✓ Created 3 branches:", TARGETS.map((t) => t.name).join(", "));
  } else {
    const used = new Set<number>();
    // First pass: match by known alias.
    for (const b of branches) {
      const idx = ALIASES[b.name] ?? ALIASES[b.code ?? ""];
      if (idx !== undefined && !used.has(idx)) {
        Object.assign(b, TARGETS[idx]);
        await b.save();
        used.add(idx);
      }
    }
    // Second pass: fill remaining branches positionally with unused targets.
    let next = 0;
    for (const b of branches) {
      const idx = ALIASES[b.name] ?? ALIASES[b.code ?? ""];
      if (idx !== undefined) continue; // already handled
      while (next < TARGETS.length && used.has(next)) next++;
      if (next >= TARGETS.length) break;
      Object.assign(b, TARGETS[next]);
      await b.save();
      used.add(next);
    }
    // Create any targets still missing.
    for (let i = 0; i < TARGETS.length; i++) {
      if (!used.has(i)) {
        await Branch.create(TARGETS[i]);
        used.add(i);
      }
    }
    console.log("✓ Branches now:", (await Branch.find({}).sort({ name: 1 }).lean()).map((b) => b.name).join(", "));
  }

  await (await connectDB()).disconnect();
  console.log("Done. ✨");
  process.exit(0);
}

main().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
