"use client";

import { useEffect, useState } from "react";

function getRemaining() {
  const now = new Date();
  // Last moment of the current month.
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  let diff = Math.max(end.getTime() - now.getTime(), 0);

  const days = Math.floor(diff / 86_400_000);
  diff -= days * 86_400_000;
  const hours = Math.floor(diff / 3_600_000);
  diff -= hours * 3_600_000;
  const minutes = Math.floor(diff / 60_000);
  diff -= minutes * 60_000;
  const seconds = Math.floor(diff / 1000);
  return { days, hours, minutes, seconds };
}

function Unit({ value, label, big }: { value: number; label: string; big?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={
          big
            ? "text-4xl font-bold tabular-nums md:text-6xl"
            : "text-xl font-bold tabular-nums text-slate-900"
        }
      >
        {String(value).padStart(2, "0")}
      </span>
      <span
        className={
          big ? "text-xs uppercase tracking-widest opacity-70" : "text-[10px] uppercase text-slate-400"
        }
      >
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({ big = false }: { big?: boolean }) {
  const [t, setT] = useState(getRemaining);

  useEffect(() => {
    const id = setInterval(() => setT(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  const sep = big ? "text-3xl md:text-5xl opacity-40" : "text-lg text-slate-300";
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <Unit value={t.days} label="Days" big={big} />
      <span className={sep}>:</span>
      <Unit value={t.hours} label="Hrs" big={big} />
      <span className={sep}>:</span>
      <Unit value={t.minutes} label="Min" big={big} />
      <span className={sep}>:</span>
      <Unit value={t.seconds} label="Sec" big={big} />
    </div>
  );
}
