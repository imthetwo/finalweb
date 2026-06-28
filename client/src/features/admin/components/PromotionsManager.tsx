"use client";
// "use client" vì: useState, useCallback, useEffect, event handlers (CRUD, pagination)

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  fetchAdminPromotions, createAdminPromotion, updateAdminPromotion, deleteAdminPromotion,
  type Promotion, type PromotionInput,
} from "@/lib/api";

const EMPTY: PromotionInput = {
  title: "",
  actionLabel: "",
  href: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
  sortOrder: 0,
};

export function PromotionsManager() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<PromotionInput>(EMPTY);
  const [saving, setSaving] = useState(false);

  // `load` just bumps a key; the effect below does the actual fetch so all
  // setState happens inside async callbacks (avoids the set-state-in-effect lint).
  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    fetchAdminPromotions()
      .then((d) => { if (active) setItems(d); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(p: Promotion) {
    setEditing(p);
    setForm({
      title: p.title,
      actionLabel: p.actionLabel ?? "",
      href: p.href ?? "",
      startsAt: p.startsAt ? p.startsAt.slice(0, 16) : "",
      endsAt: p.endsAt ? p.endsAt.slice(0, 16) : "",
      isActive: p.isActive,
      sortOrder: p.sortOrder,
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload: PromotionInput = {
        ...form,
        actionLabel: form.actionLabel || undefined,
        href: form.href || undefined,
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined,
      };
      if (editing) {
        await updateAdminPromotion(editing.id, payload);
        toast.success("Banner updated");
      } else {
        await createAdminPromotion(payload);
        toast.success("Banner created");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Promotion) {
    try {
      await updateAdminPromotion(p.id, { isActive: !p.isActive });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove(p: Promotion) {
    if (!confirm(`Delete banner "${p.title}"?`)) return;
    try {
      await deleteAdminPromotion(p.id);
      toast.success("Banner deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black uppercase tracking-wide text-fg">Banners / Promotions</h1>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 text-sm font-black uppercase tracking-wider text-black hover:bg-brand/85">
          <Plus size={14} /> Add Banner
        </button>
      </div>

      <div className="border border-edge bg-elevated">
        <table className="w-full text-body">
          <thead className="border-b border-edge text-2xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Link</th>
              <th className="px-4 py-3 text-center">Order</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-subtle">Loading…</td></tr>
            ) : !items.length ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-subtle">No banners yet.</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-b border-edge/50">
                  <td className="px-4 py-2.5 font-semibold text-fg">{p.title}</td>
                  <td className="px-4 py-2.5 text-secondary">{p.actionLabel ?? "—"}</td>
                  <td className="px-4 py-2.5 text-secondary">{p.href ?? "—"}</td>
                  <td className="px-4 py-2.5 text-center text-secondary">{p.sortOrder}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`text-2xs font-bold uppercase ${p.isActive ? "text-success" : "text-subtle"}`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(p)} className="flex h-7 w-7 items-center justify-center border border-edge text-secondary hover:border-brand/50 hover:text-brand" aria-label="Edit"><Pencil size={12} /></button>
                      <button onClick={() => remove(p)} className="flex h-7 w-7 items-center justify-center border border-red-800/40 text-destructive hover:border-destructive" aria-label="Delete"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/70 p-4">
          <div className="w-full max-w-md border border-edge bg-elevated p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-wide text-fg">
                {editing ? "Edit Banner" : "Add Banner"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-muted hover:text-fg"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-edge bg-surface px-3 py-2 text-body text-fg outline-none focus:border-brand/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Action label</label>
                  <input
                    value={form.actionLabel}
                    onChange={(e) => setForm((f) => ({ ...f, actionLabel: e.target.value }))}
                    placeholder="SHOP NOW"
                    className="w-full border border-edge bg-surface px-3 py-2 text-body text-fg outline-none focus:border-brand/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Link (href)</label>
                  <input
                    value={form.href}
                    onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
                    placeholder="/components/processors"
                    className="w-full border border-edge bg-surface px-3 py-2 text-body text-fg outline-none focus:border-brand/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Starts at</label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                    className="w-full border border-edge bg-surface px-3 py-2 text-body text-fg outline-none focus:border-brand/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Ends at</label>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                    className="w-full border border-edge bg-surface px-3 py-2 text-body text-fg outline-none focus:border-brand/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Sort order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                    className="w-full border border-edge bg-surface px-3 py-2 text-body text-fg outline-none focus:border-brand/50"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-secondary">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="h-4 w-4 accent-brand"
                    />
                    Active
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="border border-edge px-4 py-2.5 text-sm font-black uppercase tracking-wider text-secondary hover:bg-zinc-900">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="bg-brand px-4 py-2.5 text-sm font-black uppercase tracking-wider text-black hover:bg-brand/85 disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
