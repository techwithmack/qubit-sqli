"use client";

import { KeyRound, Lock, Shield, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSqlError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        sqlError?: string;
        ok?: boolean;
      };
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        setSqlError(typeof data.sqlError === "string" ? data.sqlError : null);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Could not reach the archive server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass mx-auto w-full max-w-md rounded-2xl p-8">
      <LoginIcon />
      <LoginTitle />
      <div className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            <User className="size-3.5 text-cyan-400" aria-hidden />
            Operator ID
          </span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-cyan-500/25 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400/50"
            placeholder="archivist"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            <Lock className="size-3.5 text-orange-400" aria-hidden />
            Access key
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-orange-500/25 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-orange-400/50"
            placeholder="••••••••"
          />
        </label>
        {error ? (
          <p className="rounded-xl border border-red-500/35 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        {sqlError ? (
          <pre className="overflow-auto rounded-xl border border-orange-500/35 bg-orange-950/40 px-4 py-3 font-mono text-xs text-orange-100/95">
            {sqlError}
          </pre>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/40 bg-gradient-to-r from-violet-600/30 to-cyan-600/20 py-3 text-sm font-semibold text-violet-50 transition hover:border-violet-300/60 disabled:opacity-60"
        >
          <KeyRound className="size-4" aria-hidden />
          {loading ? "Authenticating…" : "Enter archive console"}
        </button>
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        <Link href="/" className="text-cyan-400/90 hover:text-cyan-300">
          ← Return to public bestiary
        </Link>
      </p>
    </form>
  );
}

function LoginIcon() {
  return (
    <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10">
      <Shield className="size-7 text-violet-300" aria-hidden />
    </div>
  );
}

function LoginTitle() {
  return (
    <div className="mt-4 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Restricted // Admin
      </p>
      <h1 className="mt-2 text-2xl font-bold text-white glow-cyan">Archive console login</h1>
      <p className="mt-2 text-sm text-slate-400">
        Vault operators only. Unauthorized access is logged.
      </p>
    </div>
  );
}
