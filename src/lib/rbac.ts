import { ROLES, type Role } from "./constants";

/**
 * Capability map. Each capability lists the roles allowed to perform it.
 * Keep this as the single source of truth for authorization decisions.
 */
export const PERMISSIONS = {
  "company.manage": [ROLES.ADMIN],
  "branch.manage": [ROLES.ADMIN, ROLES.MANAGER],
  "user.manage": [ROLES.ADMIN],
  "kpi.manage": [ROLES.ADMIN, ROLES.MANAGER],
  "kpi.assign": [ROLES.ADMIN, ROLES.MANAGER],
  "kpi.assign.bulk": [ROLES.ADMIN, ROLES.MANAGER],
  "invoice.create": [ROLES.SALES],
  "invoice.review": [ROLES.SUPERVISOR, ROLES.ADMIN],
  "invoice.viewAll": [ROLES.ADMIN, ROLES.MANAGER, ROLES.EXECUTIVE],
  "dashboard.sales": [ROLES.SALES],
  "dashboard.supervisor": [ROLES.SUPERVISOR],
  "dashboard.manager": [ROLES.MANAGER, ROLES.ADMIN],
  "dashboard.executive": [ROLES.EXECUTIVE, ROLES.ADMIN, ROLES.MANAGER],
  "leaderboard.view": [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.SUPERVISOR,
    ROLES.SALES,
    ROLES.EXECUTIVE,
  ],
  "reports.view": [ROLES.ADMIN, ROLES.MANAGER, ROLES.EXECUTIVE, ROLES.SUPERVISOR],
  "audit.view": [ROLES.ADMIN],
  "settings.manage": [ROLES.ADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

/** The landing dashboard route for a given role. */
export function homeForRole(role: Role): string {
  switch (role) {
    case ROLES.SALES:
      return "/dashboard/sales";
    case ROLES.SUPERVISOR:
      return "/dashboard/supervisor";
    case ROLES.MANAGER:
    case ROLES.ADMIN:
      return "/dashboard/manager";
    case ROLES.EXECUTIVE:
      return "/dashboard/executive";
    default:
      return "/dashboard";
  }
}
