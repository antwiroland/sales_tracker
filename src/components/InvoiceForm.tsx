"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X } from "lucide-react";
import { CURRENCY } from "@/lib/constants";

export function InvoiceForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    invoiceNumber: "",
    customerName: "",
    amount: "",
    description: "",
    notes: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
  });
  const [imageDataUri, setImageDataUri] = useState<string>("");
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState<"" | "draft" | "submit">("");
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageDataUri(result);
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }

  async function submit(status: "DRAFT" | "SUBMITTED") {
    setError("");
    if (!form.invoiceNumber || !form.customerName || !form.amount) {
      setError("PO number, customer, and amount are required.");
      return;
    }
    setLoading(status === "DRAFT" ? "draft" : "submit");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          status,
          imageDataUri: imageDataUri || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save invoice.");
        return;
      }
      router.push("/dashboard/invoices");
      router.refresh();
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="card max-w-2xl p-6">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">PO Number *</label>
          <input
            className="input"
            value={form.invoiceNumber}
            onChange={(e) => set("invoiceNumber", e.target.value)}
            placeholder="PO-0001"
          />
        </div>
        <div>
          <label className="label">PO Date *</label>
          <input
            type="date"
            className="input"
            value={form.invoiceDate}
            onChange={(e) => set("invoiceDate", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Customer Name *</label>
          <input
            className="input"
            value={form.customerName}
            onChange={(e) => set("customerName", e.target.value)}
            placeholder="Acme Ltd."
          />
        </div>
        <div>
          <label className="label">Amount ({CURRENCY}) *</label>
          <input
            type="number"
            min="0"
            className="input"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="50000"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Description</label>
        <input
          className="input"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What was sold"
        />
      </div>

      <div className="mt-4">
        <label className="label">Notes</label>
        <textarea
          className="input min-h-20"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Optional notes for your supervisor"
        />
      </div>

      <div className="mt-4">
        <label className="label">Purchase Order Image</label>
        {preview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="h-40 rounded-lg border border-slate-200 object-cover"
            />
            <button
              onClick={() => {
                setPreview("");
                setImageDataUri("");
              }}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 text-slate-400 hover:border-brand-400 hover:text-brand-500">
            <Upload size={24} />
            <span className="mt-2 text-sm">Click to upload purchase order image</span>
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={() => submit("DRAFT")}
          disabled={loading !== ""}
          className="btn-secondary"
        >
          {loading === "draft" && <Loader2 size={16} className="animate-spin" />}
          Save Draft
        </button>
        <button
          onClick={() => submit("SUBMITTED")}
          disabled={loading !== ""}
          className="btn-primary"
        >
          {loading === "submit" && <Loader2 size={16} className="animate-spin" />}
          Submit for Approval
        </button>
      </div>
    </div>
  );
}
