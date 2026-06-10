"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { navForRole } from "@/lib/nav";
import { ROLE_LABELS, type Role } from "@/lib/constants";

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const C = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[
    name
  ];
  return C ? <C size={size} /> : <Icons.Circle size={size} />;
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navForRole(role);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow md:hidden"
        aria-label="Toggle navigation"
      >
        <Icons.Menu size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <Icons.BarChart3 className="text-brand-600" size={24} />
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900">Sales KPI</p>
            <p className="text-[11px] text-slate-400">{ROLE_LABELS[role]}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
