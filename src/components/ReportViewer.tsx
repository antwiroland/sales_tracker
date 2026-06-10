"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Loader2, FileText, FileSpreadsheet, Download } from "lucide-react";
import { Card, Table, Th, Td, EmptyState } from "./ui";
import { MONTH_NAMES, formatCurrency, formatPercent } from "@/lib/utils";

interface Column {
  key: string;
  label: string;
  type?: "currency" | "percent" | "number" | "text";
}
interface Dataset {
  type: string;
  title: string;
  period: string;
  columns: Column[];
  rows: Record<string, unknown>[];
}

const REPORTS = [
  { id: "employee", label: "Employee Performance" },
  { id: "supervisor", label: "Supervisor Performance" },
  { id: "branch", label: "Branch Performance" },
  { id: "company", label: "Company Performance" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "invoice-approval", label: "Invoice Approval" },
];

const now = new Date();

function display(value: unknown, type?: string): string {
  if (value == null) return "—";
  if (type === "currency") return formatCurrency(Number(value));
  if (type === "percent") return formatPercent(Number(value));
  return String(value);
}

export function ReportViewer() {
  const [type, setType] = useState("employee");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/reports?type=${type}&month=${month}&year=${year}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function tableMatrix() {
    if (!data) return { head: [], body: [] as string[][] };
    const head = data.columns.map((c) => c.label);
    const body = data.rows.map((row) =>
      data.columns.map((c) => display(row[c.key], c.type)),
    );
    return { head, body };
  }

  function exportCSV() {
    if (!data) return;
    const { head, body } = tableMatrix();
    const csv = [head, ...body]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv" }), `${fileBase()}.csv`);
  }

  function exportExcel() {
    if (!data) return;
    const { head, body } = tableMatrix();
    const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${fileBase()}.xlsx`);
  }

  function exportPDF() {
    if (!data) return;
    const { head, body } = tableMatrix();
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(data.title, 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(data.period, 14, 22);
    autoTable(doc, {
      head: [head],
      body,
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`${fileBase()}.pdf`);
  }

  function fileBase() {
    return `${type}-${MONTH_NAMES[month - 1]}-${year}`.toLowerCase();
  }

  return (
    <>
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Report</label>
            <select className="input min-w-52" value={type} onChange={(e) => setType(e.target.value)}>
              {REPORTS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
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
            <input className="input w-28" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
          <button className="btn-primary" onClick={generate} disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />} Generate
          </button>
        </div>
      </Card>

      {data && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{data.title}</h2>
              <p className="text-sm text-slate-500">{data.period} · {data.rows.length} rows</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={exportCSV}>
                <Download size={15} /> CSV
              </button>
              <button className="btn-secondary" onClick={exportExcel}>
                <FileSpreadsheet size={15} /> Excel
              </button>
              <button className="btn-secondary" onClick={exportPDF}>
                <FileText size={15} /> PDF
              </button>
            </div>
          </div>

          {data.rows.length === 0 ? (
            <EmptyState title="No data for this period" />
          ) : (
            <Table>
              <thead>
                <tr>
                  {data.columns.map((c) => (
                    <Th key={c.key}>{c.label}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i}>
                    {data.columns.map((c) => (
                      <Td key={c.key}>{display(row[c.key], c.type)}</Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
    </>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
