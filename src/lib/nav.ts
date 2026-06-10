import { ROLES, type Role } from "./constants";

export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name
  roles: Role[];
}

/** Sidebar navigation. Items are filtered by the current user's role. */
export const NAV_ITEMS: NavItem[] = [
  {
    label: "My Dashboard",
    href: "/dashboard/sales",
    icon: "LayoutDashboard",
    roles: [ROLES.SALES],
  },
  {
    label: "Approval Queue",
    href: "/dashboard/supervisor",
    icon: "ClipboardCheck",
    roles: [ROLES.SUPERVISOR],
  },
  {
    label: "Company Dashboard",
    href: "/dashboard/manager",
    icon: "LayoutDashboard",
    roles: [ROLES.MANAGER, ROLES.ADMIN],
  },
  {
    label: "Executive",
    href: "/dashboard/executive",
    icon: "Crown",
    roles: [ROLES.EXECUTIVE, ROLES.ADMIN, ROLES.MANAGER],
  },
  {
    label: "My Invoices",
    href: "/dashboard/invoices",
    icon: "FileText",
    roles: [ROLES.SALES],
  },
  {
    label: "Submit Invoice",
    href: "/dashboard/invoices/new",
    icon: "FilePlus2",
    roles: [ROLES.SALES],
  },
  {
    label: "KPIs",
    href: "/dashboard/kpis",
    icon: "Target",
    roles: [ROLES.ADMIN, ROLES.MANAGER],
  },
  {
    label: "Assign KPIs",
    href: "/dashboard/kpis/assign",
    icon: "ListChecks",
    roles: [ROLES.ADMIN, ROLES.MANAGER],
  },
  {
    label: "Leaderboard",
    href: "/dashboard/leaderboard",
    icon: "Trophy",
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.SALES, ROLES.EXECUTIVE],
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: "FileBarChart",
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.EXECUTIVE, ROLES.SUPERVISOR],
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: "Users",
    roles: [ROLES.ADMIN],
  },
  {
    label: "Branches",
    href: "/dashboard/branches",
    icon: "Building2",
    roles: [ROLES.ADMIN, ROLES.MANAGER],
  },
  {
    label: "Audit Log",
    href: "/dashboard/audit",
    icon: "ScrollText",
    roles: [ROLES.ADMIN],
  },
  {
    label: "TV Display",
    href: "/tv-display",
    icon: "MonitorPlay",
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.EXECUTIVE, ROLES.SUPERVISOR],
  },
];

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((i) => i.roles.includes(role));
}
