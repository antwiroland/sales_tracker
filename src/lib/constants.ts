// Shared constants & enums — safe to import from both client and server.

export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  SALES_MANAGER: "SALES_MANAGER",
  SUPERVISOR: "SUPERVISOR",
  SALES: "SALES",
  EXECUTIVE: "EXECUTIVE",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = Object.values(ROLES);

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  SALES_MANAGER: "Sales Manager",
  SUPERVISOR: "Supervisor",
  SALES: "Sales Personnel",
  EXECUTIVE: "Executive",
};

/** Company / product name shown throughout the app. */
export const COMPANY_NAME = "Trade Mart";

export const INVOICE_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PENDING: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const HEALTH = {
  GREEN: "GREEN", // On Track
  AMBER: "AMBER", // At Risk
  RED: "RED", // Behind Schedule
} as const;

export type Health = (typeof HEALTH)[keyof typeof HEALTH];

export const HEALTH_LABELS: Record<Health, string> = {
  GREEN: "On Track",
  AMBER: "At Risk",
  RED: "Behind Schedule",
};

export const NOTIFICATION_TYPES = {
  INVOICE_APPROVED: "INVOICE_APPROVED",
  INVOICE_REJECTED: "INVOICE_REJECTED",
  CLARIFICATION_REQUESTED: "CLARIFICATION_REQUESTED",
  KPI_ASSIGNED: "KPI_ASSIGNED",
  RANK_CHANGED: "RANK_CHANGED",
  TARGET_ACHIEVED: "TARGET_ACHIEVED",
  MONTH_END_REMINDER: "MONTH_END_REMINDER",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const AUDIT_ACTIONS = {
  LOGIN: "LOGIN",
  INVOICE_SUBMITTED: "INVOICE_SUBMITTED",
  INVOICE_APPROVED: "INVOICE_APPROVED",
  INVOICE_REJECTED: "INVOICE_REJECTED",
  INVOICE_DELETED: "INVOICE_DELETED",
  CLARIFICATION_REQUESTED: "CLARIFICATION_REQUESTED",
  KPI_ASSIGNED: "KPI_ASSIGNED",
  KPI_BULK_ASSIGNED: "KPI_BULK_ASSIGNED",
  KPI_CREATED: "KPI_CREATED",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  PROFILE_UPDATED: "PROFILE_UPDATED",
  REPORT_GENERATED: "REPORT_GENERATED",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

// Default app currency for display.
export const CURRENCY = "GH₵";

export const TV_ROTATION_OPTIONS = [
  { label: "30 Seconds", value: 30 },
  { label: "1 Minute", value: 60 },
  { label: "2 Minutes", value: 120 },
  { label: "5 Minutes", value: 300 },
];
