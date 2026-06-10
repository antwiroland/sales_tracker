import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `${CURRENCY}${n.toLocaleString("en-GH", { maximumFractionDigits: 0 })}`;
}

export function formatNumber(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("en-GH", {
    maximumFractionDigits: 1,
  });
}

export function formatPercent(n: number): string {
  return `${(Number.isFinite(n) ? n : 0).toFixed(1)}%`;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function initials(firstName?: string, lastName?: string): string {
  return `${(firstName?.[0] ?? "").toUpperCase()}${(lastName?.[0] ?? "").toUpperCase()}` || "?";
}

/** Avatar URL fallback when a user has no profile photo. */
export function avatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=2563eb&color=fff&bold=true`;
}

// ----- Month / period helpers -----

export function currentMonthYear(date = new Date()): { month: number; year: number } {
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

export function monthBounds(month: number, year: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999); // last day of month
  return { start, end };
}

export function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * For the active month, how many days have elapsed (inclusive of today) and how
 * many remain (inclusive of today). For past months everything is elapsed; for
 * future months nothing is.
 */
export function monthProgress(month: number, year: number, now = new Date()) {
  const total = daysInMonth(month, year);
  const { start, end } = monthBounds(month, year);
  let elapsed: number;
  if (now < start) elapsed = 0;
  else if (now > end) elapsed = total;
  else elapsed = now.getDate();
  const remaining = Math.max(total - elapsed, 0);
  return { total, elapsed, remaining, fraction: total ? elapsed / total : 1 };
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(n, 999));
}
