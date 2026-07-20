"use client";

import { MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";

import { AddressFields } from "@/components/ui/AddressFields";
import { displayCityName } from "@/lib/vn-locations";
import { useAddressBook } from "../hooks/useAddressBook";

const inputCls =
  "w-full border border-edge bg-surface px-4 py-2.5 text-sm text-fg outline-none transition-colors focus:border-brand/50 placeholder:text-subtle";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted";

export function AddressBookTab() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const {
    addresses, loading, formOpen, editingId, form, setForm, saving, busyId,
    openCreate, openEdit, closeForm, save, remove, setDefault,
  } = useAddressBook();

  if (loading) return <p className="py-12 text-center text-sm text-muted">Loading addresses…</p>;

  return (
    <div className="space-y-6">
      {!formOpen && (
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-brand px-5 py-2.5 text-sm font-black uppercase tracking-wider text-black transition hover:bg-brand/85"
        >
          <Plus size={13} /> Add address
        </button>
      )}

      {formOpen && (
        <form onSubmit={save} className="space-y-4 border border-edge bg-elevated p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-fg">
              {editingId ? "Edit address" : "New address"}
            </h3>
            <button type="button" onClick={closeForm} aria-label="Cancel" className="text-muted hover:text-fg">
              <X size={16} />
            </button>
          </div>

          <div>
            <label className={labelCls}>Label (optional)</label>
            <input
              className={inputCls}
              placeholder="Home, Office…"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>

          <AddressFields value={form} onChange={(v) => setForm({ ...form, ...v })} />

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-brand px-5 py-2.5 text-sm font-black uppercase tracking-wider text-black transition hover:bg-brand/85 disabled:opacity-50"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Add address"}
          </button>
        </form>
      )}

      {!addresses.length && !formOpen && (
        <div className="flex flex-col items-center gap-3 border border-dashed border-edge py-16 text-muted">
          <MapPin size={32} className="opacity-30" />
          <p className="text-sm">You have no saved addresses yet.</p>
        </div>
      )}

      {addresses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="border border-edge bg-elevated p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold uppercase tracking-wider text-fg">
                  {a.label || "Address"}
                </p>
                {a.isDefault && (
                  <span className="flex shrink-0 items-center gap-1 border border-brand/40 bg-brand/10 px-2 py-0.5 text-2xs font-black uppercase tracking-wider text-brand">
                    <Star size={10} className="fill-brand" /> Default
                  </span>
                )}
              </div>
              <p className="font-semibold text-fg">{a.recipient}</p>
              <p className="text-body text-secondary">{a.phone}</p>
              <p className="text-body text-secondary">{[a.street, a.ward, displayCityName(a.city)].join(", ")}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {!a.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefault(a.id)}
                    disabled={busyId === a.id}
                    className="border border-edge px-3 py-1.5 text-2xs font-bold uppercase tracking-wider text-secondary transition hover:border-brand/40 hover:text-brand disabled:opacity-40"
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(a)}
                  className="flex h-8 w-8 items-center justify-center border border-edge text-secondary transition hover:border-brand/50 hover:text-brand"
                  aria-label="Edit address"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  disabled={busyId === a.id}
                  className="flex h-8 w-8 items-center justify-center border border-red-800/40 text-destructive transition hover:border-destructive disabled:opacity-40"
                  aria-label="Delete address"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
