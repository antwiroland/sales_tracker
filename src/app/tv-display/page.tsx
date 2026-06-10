"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize, Minimize, Pause, Play, X } from "lucide-react";
import Link from "next/link";
import { CountdownTimer } from "@/components/CountdownTimer";
import { TV_ROTATION_OPTIONS, HEALTH_LABELS } from "@/lib/constants";
import { formatCurrency, formatPercent, avatarUrl, MONTH_NAMES } from "@/lib/utils";

interface EmployeeSummary {
  employeeId: string;
  name: string;
  branchName: string;
  photoUrl: string;
  target: number;
  approved: number;
  achievementPercent: number;
  forecast: { health: string; projectedSales: number };
}
interface TvData {
  month: number;
  year: number;
  company: {
    totalTarget: number;
    totalApproved: number;
    achievementPercent: number;
    employeeCount: number;
  };
  leaderboard: EmployeeSummary[];
  branches: { name: string; approved: number; achievementPercent: number; employeeCount: number }[];
}

const healthColor: Record<string, string> = {
  GREEN: "text-emerald-400",
  AMBER: "text-amber-400",
  RED: "text-red-400",
};
const healthBar: Record<string, string> = {
  GREEN: "bg-emerald-400",
  AMBER: "bg-amber-400",
  RED: "bg-red-400",
};

export default function TvDisplayPage() {
  const [data, setData] = useState<TvData | null>(null);
  const [slide, setSlide] = useState(0);
  const [interval, setIntervalSecs] = useState(120);
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/tv");
      if (res.ok) setData(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  // Build slide list: company, leaderboard, top employees, branches.
  const slides = useMemo(() => {
    if (!data) return [] as { kind: string; payload?: EmployeeSummary }[];
    const list: { kind: string; payload?: EmployeeSummary }[] = [
      { kind: "company" },
      { kind: "leaderboard" },
    ];
    data.leaderboard.slice(0, 6).forEach((e) => list.push({ kind: "employee", payload: e }));
    list.push({ kind: "branches" });
    return list;
  }, [data]);

  useEffect(() => {
    if (paused || slides.length === 0) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), interval * 1000);
    return () => clearInterval(id);
  }, [paused, slides.length, interval]);

  useEffect(() => {
    if (slide >= slides.length) setSlide(0);
  }, [slide, slides.length]);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreen(false);
    }
  }

  const current = slides[slide];
  const period = data ? `${MONTH_NAMES[data.month - 1]} ${data.year}` : "";

  return (
    <div
      ref={containerRef}
      className="tv-mode relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900 text-white"
    >
      {/* Controls */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 opacity-60 transition hover:opacity-100">
        <select
          value={interval}
          onChange={(e) => setIntervalSecs(Number(e.target.value))}
          className="rounded-lg bg-white/10 px-2 py-1 text-sm"
        >
          {TV_ROTATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="text-black">
              {o.label}
            </option>
          ))}
        </select>
        <button onClick={() => setPaused((p) => !p)} className="rounded-lg bg-white/10 p-2">
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </button>
        <button onClick={toggleFullscreen} className="rounded-lg bg-white/10 p-2">
          {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
        <Link href="/dashboard" className="rounded-lg bg-white/10 p-2">
          <X size={18} />
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-10 pt-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Sales Performance</h1>
          <p className="text-white/50">{period}</p>
        </div>
        <CountdownTimer big />
      </div>

      {/* Slide body */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        {!data ? (
          <p className="text-white/50">Loading live data…</p>
        ) : current?.kind === "company" ? (
          <div className="w-full max-w-4xl text-center">
            <p className="text-xl text-white/60">Company Achievement</p>
            <p className="my-4 text-7xl font-black md:text-9xl">
              {formatPercent(data.company.achievementPercent)}
            </p>
            <div className="mx-auto h-4 max-w-2xl overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${Math.min(data.company.achievementPercent, 100)}%` }}
              />
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6">
              <Stat label="Total Target" value={formatCurrency(data.company.totalTarget)} />
              <Stat label="Total Achieved" value={formatCurrency(data.company.totalApproved)} />
              <Stat label="Sales Personnel" value={String(data.company.employeeCount)} />
            </div>
          </div>
        ) : current?.kind === "leaderboard" ? (
          <div className="w-full max-w-4xl">
            <h2 className="mb-6 text-center text-3xl font-bold">🏆 Top Performers</h2>
            <div className="space-y-3">
              {data.leaderboard.slice(0, 8).map((e, i) => (
                <div
                  key={e.employeeId}
                  className="flex items-center gap-4 rounded-2xl bg-white/5 px-5 py-3 backdrop-blur"
                >
                  <span className="w-8 text-2xl font-black text-white/40">{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={e.photoUrl || avatarUrl(e.name)}
                    alt={e.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-lg font-semibold">{e.name}</p>
                    <p className="text-sm text-white/50">{e.branchName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(e.approved)}</p>
                    <p className={`text-sm ${healthColor[e.forecast.health]}`}>
                      {formatPercent(e.achievementPercent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : current?.kind === "employee" && current.payload ? (
          <EmployeeSlide e={current.payload} />
        ) : current?.kind === "branches" ? (
          <div className="w-full max-w-4xl">
            <h2 className="mb-6 text-center text-3xl font-bold">🏢 Branch Performance</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.branches.map((b) => (
                <div key={b.name} className="rounded-2xl bg-white/5 p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-semibold">{b.name}</p>
                    <p className="text-2xl font-black">{formatPercent(b.achievementPercent)}</p>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-brand-400"
                      style={{ width: `${Math.min(b.achievementPercent, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-white/50">
                    {formatCurrency(b.approved)} · {b.employeeCount} staff
                  </p>
                </div>
              ))}
              {data.branches.length === 0 && (
                <p className="text-white/40">No branch data.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Slide indicators */}
      <div className="flex justify-center gap-2 pb-6">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`h-2 rounded-full transition-all ${
              i === slide ? "w-8 bg-white" : "w-2 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-5 backdrop-blur">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function EmployeeSlide({ e }: { e: EmployeeSummary }) {
  return (
    <div className="w-full max-w-3xl text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={e.photoUrl || avatarUrl(e.name)}
        alt={e.name}
        className="mx-auto h-40 w-40 rounded-full object-cover ring-4 ring-white/20"
      />
      <h2 className="mt-5 text-4xl font-bold">{e.name}</h2>
      <p className="text-white/50">{e.branchName}</p>

      <p className="my-6 text-8xl font-black">{formatPercent(e.achievementPercent)}</p>
      <div className="mx-auto h-4 max-w-2xl overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${healthBar[e.forecast.health]} transition-all`}
          style={{ width: `${Math.min(e.achievementPercent, 100)}%` }}
        />
      </div>

      <div className="mt-8 grid grid-cols-3 gap-6">
        <Stat label="Target" value={formatCurrency(e.target)} />
        <Stat label="Approved" value={formatCurrency(e.approved)} />
        <Stat label="Forecast" value={formatCurrency(e.forecast.projectedSales)} />
      </div>
      <p className={`mt-4 text-lg font-semibold ${healthColor[e.forecast.health]}`}>
        {HEALTH_LABELS[e.forecast.health as keyof typeof HEALTH_LABELS]}
      </p>
    </div>
  );
}
