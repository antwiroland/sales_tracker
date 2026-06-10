"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(0)}k`
      : `${n}`;

export function TrendChart({ data }: { data: { day: number; approved: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 12 }} stroke="#94a3b8" width={40} />
        <Tooltip formatter={(v: number) => v.toLocaleString()} />
        <Line
          type="monotone"
          dataKey="approved"
          stroke="#2563eb"
          strokeWidth={2.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ComparisonChart({
  data,
  colorByPercent = false,
}: {
  data: { name: string; approved: number; target?: number; achievementPercent?: number }[];
  colorByPercent?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 44)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 12 }}
          stroke="#94a3b8"
        />
        <Tooltip formatter={(v: number) => v.toLocaleString()} />
        <Bar dataKey="approved" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => {
            const pct = d.achievementPercent ?? 0;
            const color = !colorByPercent
              ? "#2563eb"
              : pct >= 90
                ? "#10b981"
                : pct >= 60
                  ? "#f59e0b"
                  : "#ef4444";
            return <Cell key={i} fill={color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
