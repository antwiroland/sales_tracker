"use client";

import { useEffect, useState } from "react";
import { Check, X, MessageSquare, Loader2, ExternalLink } from "lucide-react";
import { Badge, EmptyState } from "./ui";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  description?: string;
  invoiceDate: string;
  status: string;
  image?: { url?: string };
  employeeId?: { firstName?: string; lastName?: string };
}

type Action = "approve" | "reject" | "clarify";

export function ApprovalQueue() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [modal, setModal] = useState<{ id: string; action: Action } | null>(null);
  const [reason, setReason] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices?status=SUBMITTED");
      const data = await res.json();
      setInvoices(data.invoices ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: Action, body?: object) {
    setBusy(id);
    try {
      const res = await fetch(`/api/invoices/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      if (res.ok) {
        setInvoices((prev) => prev.filter((i) => i._id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Action failed");
      }
    } finally {
      setBusy(null);
      setModal(null);
      setReason("");
    }
  }

  function submitModal() {
    if (!modal) return;
    if (!reason.trim()) return;
    if (modal.action === "reject") act(modal.id, "reject", { reason });
    else act(modal.id, "clarify", { note: reason });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-slate-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <EmptyState
        title="Queue is clear 🎉"
        message="No purchase orders waiting for review."
      />
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((inv) => (
        <div key={inv._id} className="card flex flex-wrap items-center gap-4 p-4">
          {inv.image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={inv.image.url}
              alt="Invoice"
              className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
              No image
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800">{inv.customerName}</p>
              <Badge color="amber">Pending</Badge>
            </div>
            <p className="text-xs text-slate-500">
              {inv.invoiceNumber} ·{" "}
              {inv.employeeId
                ? `${inv.employeeId.firstName} ${inv.employeeId.lastName}`
                : "—"}{" "}
              · {formatDate(inv.invoiceDate)}
            </p>
            {inv.description && (
              <p className="mt-1 truncate text-xs text-slate-400">{inv.description}</p>
            )}
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">{formatCurrency(inv.amount)}</p>
            {inv.image?.url && (
              <a
                href={inv.image.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                View image <ExternalLink size={11} />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => act(inv._id, "approve")}
              disabled={busy === inv._id}
              className="btn-primary !px-3"
              title="Approve"
            >
              {busy === inv._id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
            </button>
            <button
              onClick={() => setModal({ id: inv._id, action: "clarify" })}
              disabled={busy === inv._id}
              className="btn-secondary !px-3"
              title="Request clarification"
            >
              <MessageSquare size={16} />
            </button>
            <button
              onClick={() => setModal({ id: inv._id, action: "reject" })}
              disabled={busy === inv._id}
              className="btn-danger !px-3"
              title="Reject"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-1 font-semibold text-slate-800">
              {modal.action === "reject" ? "Reject Purchase Order" : "Request Clarification"}
            </h3>
            <p className="mb-3 text-sm text-slate-500">
              {modal.action === "reject"
                ? "Provide a reason for rejection. The salesperson will be notified."
                : "Explain what needs clarifying. The purchase order returns to the salesperson as a draft."}
            </p>
            <textarea
              className="input min-h-24"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Type your message…"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setModal(null);
                  setReason("");
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={submitModal}
                disabled={!reason.trim()}
                className={modal.action === "reject" ? "btn-danger" : "btn-primary"}
              >
                {modal.action === "reject" ? "Reject" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
