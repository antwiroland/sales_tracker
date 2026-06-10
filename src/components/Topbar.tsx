"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Check } from "lucide-react";
import { Avatar } from "./ui";
import { ROLE_LABELS, type Role } from "@/lib/constants";

interface Notification {
  _id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export function Topbar({
  name,
  role,
  image,
}: {
  name: string;
  role: Role;
  image?: string | null;
}) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-end gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-6">
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <button
                  onClick={markAll}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                >
                  <Check size={12} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  No notifications
                </p>
              ) : (
                items.map((n) => (
                  <Link
                    key={n._id}
                    href={n.link || "#"}
                    onClick={() => setOpen(false)}
                    className={`block border-b border-slate-50 px-4 py-3 hover:bg-slate-50 ${
                      n.read ? "" : "bg-brand-50/40"
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    {n.message && (
                      <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
        <Avatar name={name} src={image} size={36} />
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-semibold text-slate-800">{name}</p>
          <p className="text-[11px] text-slate-400">{ROLE_LABELS[role]}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
