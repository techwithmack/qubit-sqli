"use client";

import type { AdminSession, Creature, User } from "@/lib/types";
import { Database, LogOut, Pencil, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const emptyForm = {
  name: "",
  species: "",
  danger_level: "5",
  home_planet: "",
  description: "",
};

export function AdminConsole({ session }: { session: AdminSession }) {
  const router = useRouter();
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [cRes, uRes] = await Promise.all([
      fetch("/api/admin/creatures"),
      fetch("/api/admin/users"),
    ]);
    if (cRes.ok) {
      const data = (await cRes.json()) as { creatures?: Creature[] };
      setCreatures(data.creatures ?? []);
    }
    if (uRes.ok) {
      const data = (await uRes.json()) as { users?: User[] };
      setUsers(data.users ?? []);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function startEdit(creature: Creature) {
    setEditingId(creature.id);
    setForm({
      name: creature.name,
      species: creature.species,
      danger_level: String(creature.danger_level),
      home_planet: creature.home_planet,
      description: creature.description,
    });
    setMessage(null);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const payload = {
      name: form.name,
      species: form.species,
      danger_level: parseInt(form.danger_level, 10),
      home_planet: form.home_planet,
      description: form.description,
    };
    const url =
      editingId !== null ? `/api/admin/creatures/${editingId}` : "/api/admin/creatures";
    const method = editingId !== null ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setMessage(editingId !== null ? "Creature updated." : "Creature added.");
    resetForm();
    await loadData();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this creature record?")) return;
    const res = await fetch(`/api/admin/creatures/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Delete failed");
      return;
    }
    setMessage("Creature deleted.");
    if (editingId === id) resetForm();
    await loadData();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-violet-300/80">Admin console</p>
            <h1 className="text-2xl font-bold text-white glow-cyan">Archive control</h1>
            <p className="text-sm text-slate-400">
              Signed in as <span className="text-cyan-300">{session.username}</span> (
              {session.clearance_level})
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-xl border border-cyan-500/30 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/10"
            >
              View public site
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-500/30 px-4 py-2 text-sm text-orange-100 hover:bg-orange-500/10"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {message ? (
          <p className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-3 text-sm text-cyan-100">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-red-500/35 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <section className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="size-5 text-cyan-400" aria-hidden />
            <h2 className="text-lg font-semibold text-white">
              {editingId !== null ? `Edit creature #${editingId}` : "Add creature"}
            </h2>
          </div>
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field
              label="Species"
              value={form.species}
              onChange={(v) => setForm({ ...form, species: v })}
            />
            <Field
              label="Danger level"
              value={form.danger_level}
              onChange={(v) => setForm({ ...form, danger_level: v })}
              type="number"
            />
            <Field
              label="Home planet"
              value={form.home_planet}
              onChange={(v) => setForm({ ...form, home_planet: v })}
            />
            <label className="sm:col-span-2">
              <span className="text-xs text-slate-400">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                className="rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-5 py-2 text-sm font-semibold text-cyan-50"
              >
                {editingId !== null ? "Update record" : "Create record"}
              </button>
              {editingId !== null ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-white/15 px-5 py-2 text-sm text-slate-300"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Database className="size-5 text-violet-400" aria-hidden />
            <h2 className="text-lg font-semibold text-white">Creature registry</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Species</th>
                  <th className="py-2 pr-4">D-level</th>
                  <th className="py-2 pr-4">Planet</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {creatures.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 text-slate-300">
                    <td className="py-3 pr-4">{c.id}</td>
                    <td className="py-3 pr-4 text-white">{c.name}</td>
                    <td className="py-3 pr-4">{c.species}</td>
                    <td className="py-3 pr-4">{c.danger_level}</td>
                    <td className="py-3 pr-4">{c.home_planet}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="rounded-lg border border-violet-500/30 p-1.5 text-violet-200 hover:bg-violet-500/10"
                          aria-label={`Edit ${c.name}`}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(c.id)}
                          className="rounded-lg border border-red-500/30 p-1.5 text-red-200 hover:bg-red-500/10"
                          aria-label={`Delete ${c.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="size-5 text-orange-400" aria-hidden />
            <h2 className="text-lg font-semibold text-white">Operator accounts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Username</th>
                  <th className="py-2 pr-4">Password (stored)</th>
                  <th className="py-2">Clearance</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 text-slate-300">
                    <td className="py-3 pr-4">{u.id}</td>
                    <td className="py-3 pr-4 text-white">{u.username}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{u.password}</td>
                    <td className="py-3">{u.clearance_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="text-xs text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
      />
    </label>
  );
}
