"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Loader2, Upload, Users, User as UserIcon, FileSpreadsheet } from "lucide-react";
import { MONTH_NAMES } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  branchId?: { _id: string; name: string } | null;
}
interface Kpi {
  _id: string;
  name: string;
}

type Mode = "individual" | "bulk" | "excel";

const now = new Date();

export function KpiAssign() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [mode, setMode] = useState<Mode>("individual");

  const [kpiId, setKpiId] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [target, setTarget] = useState("");

  const [employeeId, setEmployeeId] = useState(""); // individual
  const [selected, setSelected] = useState<Set<string>>(new Set()); // bulk
  const [branchFilter, setBranchFilter] = useState("");

  const [excelRows, setExcelRows] = useState<{ email: string; target: number }[]>([]);
  const [excelName, setExcelName] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/users?role=SALES").then((r) => r.json()).then((d) => setEmployees(d.users ?? []));
    fetch("/api/kpis?active=true").then((r) => r.json()).then((d) => {
      setKpis(d.kpis ?? []);
      if (d.kpis?.[0]) setKpiId(d.kpis[0]._id);
    });
  }, []);

  const branches = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => {
      if (e.branchId) map.set(e.branchId._id, e.branchId.name);
    });
    return [...map.entries()];
  }, [employees]);

  const visibleEmployees = useMemo(
    () => (branchFilter ? employees.filter((e) => e.branchId?._id === branchFilter) : employees),
    [employees, branchFilter],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function onExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      const rows = json
        .map((r) => {
          const email = String(r.email ?? r.Email ?? r.EMAIL ?? "").trim().toLowerCase();
          const target = Number(r.target ?? r.Target ?? r.TARGET ?? 0);
          return { email, target };
        })
        .filter((r) => r.email && r.target > 0);
      setExcelRows(rows);
    };
    reader.readAsArrayBuffer(file);
  }

  async function submit() {
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "individual") {
        const res = await fetch("/api/kpi-assignment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId, kpiId, targetValue: Number(target), month, year }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
        setMsg({ type: "ok", text: "KPI assigned successfully." });
      } else if (mode === "bulk") {
        const res = await fetch("/api/kpi-assignment/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeIds: [...selected],
            kpiId,
            targetValue: Number(target),
            month,
            year,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        setMsg({ type: "ok", text: `Assigned to ${data.processed} employees.` });
        setSelected(new Set());
      } else {
        // Excel: map emails -> employeeIds
        const byEmail = new Map(employees.map((e) => [e.email.toLowerCase(), e._id]));
        const rows = excelRows
          .map((r) => ({ employeeId: byEmail.get(r.email), kpiId, targetValue: r.target }))
          .filter((r): r is { employeeId: string; kpiId: string; targetValue: number } =>
            Boolean(r.employeeId),
          );
        if (rows.length === 0) throw new Error("No matching employees found in the file.");
        const res = await fetch("/api/kpi-assignment/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows, month, year }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        setMsg({
          type: "ok",
          text: `Imported ${data.processed} assignments (${excelRows.length - rows.length} unmatched).`,
        });
      }
    } catch (e) {
      setMsg({ type: "err", text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  const tabs: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: "individual", label: "Individual", icon: <UserIcon size={15} /> },
    { id: "bulk", label: "Bulk Select", icon: <Users size={15} /> },
    { id: "excel", label: "Excel Upload", icon: <FileSpreadsheet size={15} /> },
  ];

  return (
    <div className="card max-w-3xl p-6">
      <div className="mb-5 flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
              mode === t.id
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Shared KPI + period */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">KPI</label>
          <select className="input" value={kpiId} onChange={(e) => setKpiId(e.target.value)}>
            {kpis.map((k) => (
              <option key={k._id} value={k._id}>{k.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Month</label>
          <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <input className="input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </div>

      {/* Mode-specific */}
      {mode === "individual" && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Employee</label>
            <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Select employee…</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Target Value ({CURRENCY})</label>
            <input className="input" type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="500000" />
          </div>
        </div>
      )}

      {mode === "bulk" && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="label mb-0">Target Value ({CURRENCY})</label>
            <input
              className="input max-w-40"
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="500000"
            />
          </div>
          <div className="mb-2 flex items-center gap-2">
            <select className="input max-w-48" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="">All branches</option>
              {branches.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <button
              className="btn-ghost text-xs"
              onClick={() => setSelected(new Set(visibleEmployees.map((e) => e._id)))}
            >
              Select all ({visibleEmployees.length})
            </button>
            <span className="text-xs text-slate-400">{selected.size} selected</span>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
            {visibleEmployees.map((e) => (
              <label key={e._id} className="flex cursor-pointer items-center gap-3 border-b border-slate-50 px-3 py-2 hover:bg-slate-50">
                <input type="checkbox" checked={selected.has(e._id)} onChange={() => toggle(e._id)} />
                <span className="text-sm text-slate-700">{e.firstName} {e.lastName}</span>
                <span className="ml-auto text-xs text-slate-400">{e.branchId?.name ?? "—"}</span>
              </label>
            ))}
            {visibleEmployees.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-slate-400">No employees</p>
            )}
          </div>
        </div>
      )}

      {mode === "excel" && (
        <div className="mt-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 text-slate-400 hover:border-brand-400">
            <Upload size={24} />
            <span className="mt-2 text-sm">
              {excelName || "Upload .xlsx with columns: email, target"}
            </span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onExcel} />
          </label>
          {excelRows.length > 0 && (
            <p className="mt-2 text-sm text-slate-600">
              Parsed <span className="font-semibold">{excelRows.length}</span> rows. The selected
              KPI &amp; period will be applied to all.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          className="btn-primary"
          onClick={submit}
          disabled={
            loading ||
            !kpiId ||
            (mode === "individual" && (!employeeId || !target)) ||
            (mode === "bulk" && (selected.size === 0 || !target)) ||
            (mode === "excel" && excelRows.length === 0)
          }
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Assign KPI
        </button>
      </div>
    </div>
  );
}
