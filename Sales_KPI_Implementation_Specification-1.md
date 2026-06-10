# Sales KPI Performance Management System
## Complete Implementation Specification
### Stack: Next.js 15 + TypeScript + MongoDB Atlas + Cloudinary + NextAuth

## Executive Summary

A KPI-driven sales performance management platform where sales personnel submit invoice-based sales records, supervisors approve them, and the system automatically updates KPI achievement, rankings, forecasts, dashboards, and company performance metrics.

---

# Core Business Flow

Sales Person → Submit Invoice → Supervisor Approval → KPI Update → Company Metrics Update → Leaderboards → Forecasting → Reports

---

# User Roles

## Administrator
- Manage companies
- Manage branches
- Manage users
- Configure KPIs
- Access all reports
- Manage system settings

## Manager
- Assign KPIs
- Bulk KPI assignment
- View company dashboard
- View branch performance
- View leaderboards
- View employee performance

## Supervisor
- Review invoices
- Approve invoices
- Reject invoices
- Request clarification
- Monitor team performance

## Sales Personnel
- View KPIs
- Submit invoices
- Upload invoice images
- Track performance
- View ranking

## Executive
- Read-only access
- Executive dashboard
- Company analytics

---

# Technology Stack

## Frontend
- Next.js 15 App Router
- React 19
- TypeScript
- TailwindCSS
- shadcn/ui
- Recharts
- React Hook Form
- Zod

## Backend
- Next.js Route Handlers
- Server Actions

## Database
- MongoDB Atlas
- Mongoose

## Authentication
- NextAuth

## Image Storage
- Cloudinary

## Deployment
- Vercel

---

# Cloudinary Integration

## Used For
- Profile Photos
- Invoice Images
- Company Logos
- Branch Logos

## Environment Variables

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Folder Structure

```text
sales-kpi/
  profiles/
  invoices/
  companies/
  branches/
```

---

# Database Collections

## Users

```ts
{
  _id:ObjectId,
  firstName:string,
  lastName:string,
  email:string,
  password:string,
  role:string,
  branchId:ObjectId,
  supervisorId:ObjectId,

  profilePhoto:{
    publicId:string,
    url:string
  },

  isActive:boolean,

  createdAt:Date,
  updatedAt:Date
}
```

## Branches

```ts
{
  _id:ObjectId,
  name:string,
  managerId:ObjectId,
  createdAt:Date
}
```

## KPIs

```ts
{
  _id:ObjectId,
  name:string,
  description:string,
  unit:string,
  weight:number,
  active:boolean
}
```

## KPI Assignments

```ts
{
  _id:ObjectId,
  employeeId:ObjectId,
  kpiId:ObjectId,
  targetValue:number,
  month:number,
  year:number,
  assignedBy:ObjectId
}
```

## Invoices

```ts
{
  _id:ObjectId,
  invoiceNumber:string,
  employeeId:ObjectId,
  customerName:string,
  amount:number,
  description:string,
  invoiceDate:Date,

  image:{
    publicId:string,
    url:string
  },

  status:"PENDING"|"APPROVED"|"REJECTED",

  supervisorId:ObjectId,
  approvalDate:Date,
  rejectionReason:string,

  createdAt:Date
}
```

## Notifications

## Audit Logs

## Reports

---

# KPI Assignment Module

## Individual Assignment

Manager selects:
- Employee
- KPI
- Month
- Target

## Bulk Assignment

Methods:
- Select multiple employees
- Upload Excel
- Apply KPI template

---

# Invoice Submission Module

## Create Invoice Form

Fields:

- Invoice Number
- Customer Name
- Invoice Amount
- Description
- Invoice Date
- Invoice Image
- Notes

Status:

```text
Draft
Submitted
Pending Review
Approved
Rejected
```

---

# Supervisor Approval Workflow

## Actions

### Approve

Effects:
- Invoice becomes approved
- KPI achievement updated
- Company totals updated
- Leaderboards refreshed

### Reject

Effects:
- Invoice excluded from KPI calculations

### Clarification

Effects:
- Returned to salesperson

---

# KPI Calculation Engine

## Achievement

```text
Achievement =
Sum of Approved Invoices
```

## KPI Percentage

```text
Performance % =
Approved Sales / KPI Target × 100
```

## Company Performance

```text
Company Achievement % =
Total Approved Sales / Total Assigned Targets × 100
```

---

# Sales Dashboard

Widgets:

- KPI Target
- Approved Sales
- Pending Sales
- Rejected Sales
- Achievement %
- Rank
- Forecast
- Countdown Timer
- Required Daily Sales
- Recent Invoices

---

# Supervisor Dashboard

Widgets:

- Pending Approvals
- Approved Today
- Rejected Today
- Team Achievement
- Approval Queue

---

# Manager Dashboard

Widgets:

- Company KPI
- Company Achievement
- Achievement %
- Branch Ranking
- Supervisor Ranking
- Team Ranking
- Forecast
- Approval Statistics
- Countdown Timer

---

# Executive Dashboard

Widgets:

- Company Target
- Company Achievement
- Top Branches
- Top Supervisors
- Top Sales Personnel
- Bottom Performers
- Forecasted Month End Results

---

# Leaderboard Module

## Rankings

- Revenue
- KPI Achievement %
- Approved Invoices
- Most Improved
- Top Branch
- Top Supervisor

## Employee View

```text
My Rank: #3
Need ₦250,000 to reach Rank #2
```

---

# TV Display Mode

Route:

```text
/TV-display
```

Features:

- Fullscreen
- Auto Rotate
- Auto Refresh
- Countdown Timer
- Employee Photo
- Progress Bar
- Ranking
- AI Forecast

## Rotation

Company Summary
→ Leaderboard
→ Employee 1
→ Employee 2
→ Employee 3
→ Branch Summary
→ Repeat

## Rotation Interval

Default:
2 Minutes

Configurable:
- 30 Seconds
- 1 Minute
- 2 Minutes
- 5 Minutes

---

# Employee Card

Display:

- Profile Photo
- Name
- Position
- Branch
- Rank
- KPI Target
- Approved Sales
- Achievement %
- Status
- Forecast

Fallback:
- Avatar
- User Initials

---

# Countdown Timer

Display:

Days
Hours
Minutes
Seconds

Until:

Last Day Of Month
23:59:59

---

# Performance Status

## Green
On Track

## Amber
At Risk

## Red
Behind Schedule

---

# Forecast Engine

Formula:

Projected Sales =
Current Sales +
(Daily Average × Remaining Days)

Outputs:

- Projected Revenue
- Expected KPI %
- Risk Level

---

# Notifications

- Invoice Approved
- Invoice Rejected
- KPI Assigned
- Rank Changed
- Target Achieved
- Month End Reminder

---

# Reports

Formats:

- PDF
- Excel
- CSV

Reports:

- Employee Performance
- Supervisor Performance
- Branch Performance
- Company Performance
- Invoice Approvals
- Leaderboard

---

# Security

- JWT Authentication
- Role Based Access Control
- Password Hashing
- Audit Logging
- Secure Uploads
- Rate Limiting

---

# API Endpoints

## Auth

POST /api/auth/login

## Users

GET /api/users
POST /api/users
PUT /api/users/:id

## KPI

GET /api/kpis
POST /api/kpis

## Assignments

POST /api/kpi-assignment
POST /api/kpi-assignment/bulk

## Invoices

POST /api/invoices
GET /api/invoices

## Approval

POST /api/invoices/:id/approve
POST /api/invoices/:id/reject

---

# Future AI Features

- OCR Invoice Extraction
- Duplicate Invoice Detection
- Fraud Detection
- KPI Risk Prediction
- Smart Coaching
- Sales Forecasting
- Natural Language Reports

---

# Success Criteria

- Real-time KPI updates
- Approval-driven achievement tracking
- Mobile responsive
- Multi-branch support
- Scalable architecture
- Audit compliance
- SaaS-ready design
