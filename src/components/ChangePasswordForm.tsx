"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function ChangePasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setError("");
    setSuccess(false);
    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (form.newPassword !== form.confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to change password.");
        return;
      }
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card max-w-md p-6">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          Password updated successfully.
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="label">Current Password</label>
          <input
            type="password"
            className="input"
            value={form.currentPassword}
            onChange={(e) => set("currentPassword", e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            className="input"
            value={form.newPassword}
            onChange={(e) => set("newPassword", e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input
            type="password"
            className="input"
            value={form.confirm}
            onChange={(e) => set("confirm", e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          className="btn-primary"
          onClick={submit}
          disabled={loading || !form.currentPassword || !form.newPassword || !form.confirm}
        >
          {loading && <Loader2 size={16} className="animate-spin" />} Update Password
        </button>
      </div>
    </div>
  );
}
