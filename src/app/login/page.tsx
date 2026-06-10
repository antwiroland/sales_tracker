"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Loader2 } from "lucide-react";

const DEMO_PASSWORD = "Password123!";
const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@demo.com" },
  { role: "Manager", email: "manager@demo.com" },
  { role: "Supervisor", email: "supervisor1@demo.com" },
  { role: "Sales", email: "sales1@demo.com" },
  { role: "Executive", email: "exec@demo.com" },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label className="label">Email</label>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading && <Loader2 size={16} className="animate-spin" />}
        Sign in
      </button>

      <div className="border-t border-slate-100 pt-3">
        <p className="mb-2 text-center text-xs font-medium text-slate-400">
          Demo accounts — click to fill (password: {DEMO_PASSWORD})
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setEmail(a.email);
                setPassword(DEMO_PASSWORD);
                setError("");
              }}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
            >
              {a.role}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-600 to-brand-700 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-white">
          <div className="mb-3 rounded-2xl bg-white/15 p-3">
            <BarChart3 size={32} />
          </div>
          <h1 className="text-2xl font-bold">Sales KPI System</h1>
          <p className="text-sm text-white/70">Performance & Invoice Management</p>
        </div>
        <div className="card p-6">
          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>
          <p className="mt-4 text-center text-xs text-slate-400">
            Demo accounts require running <code>npm run seed</code> first.
          </p>
        </div>
      </div>
    </div>
  );
}
