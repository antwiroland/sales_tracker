# Sales KPI Performance & Invoice Approval Management System

A KPI-driven sales performance platform: sales personnel submit invoice-based sales
records, supervisors approve them, and the system automatically updates KPI
achievement, rankings, forecasts, dashboards, leaderboards, and company metrics.

Built with **Next.js 15 (App Router) · TypeScript · MongoDB (Mongoose) · NextAuth ·
TailwindCSS · Recharts · Cloudinary**.

---

## Features

| Area | Implemented |
|------|-------------|
| Authentication | Credentials login (NextAuth v5, JWT), password hashing (bcrypt) |
| RBAC | 5 roles — Admin, Manager, Supervisor, Sales, Executive — enforced in middleware, API, and UI |
| KPI management | Create KPI templates (unit, weight, category) |
| KPI assignment | Individual, bulk multi-select, and **Excel upload** |
| Invoices | Draft/Submit workflow, image upload (Cloudinary), per-period tracking |
| Approval workflow | Approve / Reject / Request-clarification, fully audited |
| KPI engine | Approval-driven achievement, performance %, company/branch/supervisor rollups |
| Forecasting | Projected month-end sales, required daily sales, completion likelihood |
| Health indicators | Green / Amber / Red based on achievement vs. elapsed time |
| Dashboards | Sales, Supervisor, Manager, Executive — each role-specific |
| Leaderboard | Ranked personnel, podium, personal rank + "gap to next" |
| TV Display | Auto-rotating fullscreen screen (`/tv-display`) with countdown |
| Countdown timer | Live days/hours/minutes/seconds to month-end |
| Notifications | In-app bell (approvals, rejections, KPI assigned, target achieved) |
| Reports | Employee / Supervisor / Branch / Company / Leaderboard / Invoice-approval, export **PDF, Excel, CSV** |
| Audit trail | Logins, submissions, approvals, assignments, report generation |

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```env
MONGODB_URI=            # MongoDB Atlas connection string (or local mongodb://127.0.0.1:27017/sales-kpi)
AUTH_SECRET=            # run: npx auth secret   (or any random 32+ char string)
NEXTAUTH_URL=http://localhost:3000

# Optional — image upload is disabled gracefully if left blank
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=

SEED_PASSWORD=Password123!
```

### 3. Seed demo data

```bash
npm run seed
```

This creates branches, KPIs, users for every role, KPI assignments, and a month of
invoices. All demo accounts share `SEED_PASSWORD`:

| Role | Email |
|------|-------|
| Admin | `admin@demo.com` |
| Manager | `manager@demo.com` |
| Executive | `exec@demo.com` |
| Supervisor | `supervisor1@demo.com` (…2, …3) |
| Sales | `sales1@demo.com` (…2, …3, …) |

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000 and sign in.

---

## Architecture

```
src/
  app/
    api/                # Route handlers (REST): auth, users, kpis, kpi-assignment,
                        # invoices (+approve/reject/clarify), leaderboard, reports,
                        # notifications, upload, tv
    dashboard/          # Role dashboards + management pages (server components)
    tv-display/         # Auto-rotating TV mode (client)
    login/              # Sign-in
  components/           # UI primitives, charts, forms, approval queue, sidebar/topbar
  lib/
    kpi-engine.ts       # Achievement, forecasts, leaderboard, company/branch/supervisor rollups
    forecast.ts         # Projection + health calculation
    reports.ts          # Report dataset builder
    rbac.ts             # Permission matrix
    auth.ts/.config.ts  # NextAuth (split for edge-safe middleware)
    db.ts               # Cached Mongoose connection
  models/               # Mongoose schemas
  middleware.ts         # Route protection
scripts/seed.ts         # Demo data
```

### KPI calculation

- **Achievement** = sum of *approved* invoices for the period.
- **Performance %** = approved ÷ assigned target × 100.
- **Company / Branch / Supervisor %** = aggregated approved ÷ aggregated target.
- Achievement updates automatically on approval — no manual recalculation step.

### Forecast

```
Projected Sales = Current Sales + (Daily Average × Remaining Days)
```

Plus required-daily-sales to hit target and a Green/Amber/Red health signal comparing
achievement ratio to the elapsed fraction of the month.

---

## Notes & next steps

- **Security advisory:** this project pins `next@15.5.x` to match the spec. Next.js
  marks the 15.x line with a CVE deprecation notice — before deploying to production,
  upgrade (`npm install next@latest`) and re-test NextAuth compatibility.
- Image upload requires Cloudinary env vars; without them, invoices/profiles simply
  save without an image.
- Deploy target: Vercel + MongoDB Atlas. Set the same env vars in the host.
