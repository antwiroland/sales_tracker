"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { ALL_ROLES, ROLE_LABELS, type Role } from "@/lib/constants";

function useToggle() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}

async function postJSON(url: string, body: object) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

/* ---------------- KPI ---------------- */
export function KpiForm() {
  const router = useRouter();
  const { open, setOpen } = useToggle();
  const [form, setForm] = useState({ name: "", description: "", unit: "currency", weight: "1" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setLoading(true);
    try {
      await postJSON("/api/kpis", {
        name: form.name,
        description: form.description,
        unit: form.unit,
        weight: Number(form.weight) || 1,
      });
      setForm({ name: "", description: "", unit: "currency", weight: "1" });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!open)
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} /> New KPI
      </button>
    );

  return (
    <div className="card w-full max-w-md p-5">
      <h3 className="mb-3 font-semibold">New KPI</h3>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        <input className="input" placeholder="KPI name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            <option value="currency">Currency</option>
            <option value="count">Count</option>
            <option value="percent">Percent</option>
          </select>
          <input className="input" type="number" placeholder="Weight" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={loading || !form.name}>
          {loading && <Loader2 size={16} className="animate-spin" />} Create
        </button>
      </div>
    </div>
  );
}

/* ---------------- Branch ---------------- */
export function BranchForm() {
  const router = useRouter();
  const { open, setOpen } = useToggle();
  const [form, setForm] = useState({ name: "", code: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setLoading(true);
    try {
      await postJSON("/api/branches", form);
      setForm({ name: "", code: "", location: "" });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!open)
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} /> New Branch
      </button>
    );

  return (
    <div className="card w-full max-w-md p-5">
      <h3 className="mb-3 font-semibold">New Branch</h3>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        <input className="input" placeholder="Branch name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input className="input" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={loading || !form.name}>
          {loading && <Loader2 size={16} className="animate-spin" />} Create
        </button>
      </div>
    </div>
  );
}

/* ---------------- User ---------------- */
interface Option {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

export function UserForm() {
  const router = useRouter();
  const { open, setOpen } = useToggle();
  const [branches, setBranches] = useState<Option[]>([]);
  const [supervisors, setSupervisors] = useState<Option[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "SALES" as Role,
    position: "",
    branchId: "",
    supervisorId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/branches").then((r) => r.json()).then((d) => setBranches(d.branches ?? []));
    fetch("/api/users?role=SUPERVISOR").then((r) => r.json()).then((d) => setSupervisors(d.users ?? []));
  }, [open]);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      await postJSON("/api/users", {
        ...form,
        branchId: form.branchId || null,
        supervisorId: form.supervisorId || null,
      });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!open)
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} /> New User
      </button>
    );

  return (
    <div className="card w-full max-w-lg p-5">
      <h3 className="mb-3 font-semibold">New User</h3>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <input className="input" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input className="input" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <input className="input col-span-2" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="Password (min 6)" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input className="input" placeholder="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
        <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <select className="input" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
          <option value="">No branch</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
        {form.role === "SALES" && (
          <select className="input col-span-2" value={form.supervisorId} onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}>
            <option value="">No supervisor</option>
            {supervisors.map((s) => (
              <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
            ))}
          </select>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={loading || !form.email || form.password.length < 6}>
          {loading && <Loader2 size={16} className="animate-spin" />} Create
        </button>
      </div>
    </div>
  );
}
