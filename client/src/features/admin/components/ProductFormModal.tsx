"use client";

import Image from "next/image";
import { X, Upload } from "lucide-react";

import type { AdminProduct } from "@/lib/api";
import { useProductFormModal } from "../hooks/useProductFormModal";
import { ProductSpecFields, Field, inputCls, labelCls } from "./ProductSpecFields";

const rowCls = "grid grid-cols-2 gap-4";
const row3Cls = "grid grid-cols-3 gap-4";

export default function ProductFormModal({
  editing, defaultCategoryId, onClose, onSaved,
}: {
  editing: AdminProduct | null;
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const {
    isAdmin, categories, form, set, specFields, setSpec, specKey,
    saving, preview, uploading, fileRef, onUpload, submit,
  } = useProductFormModal({ editing, defaultCategoryId, onClose, onSaved });

  const cls = {
    input: inputCls,
    label: labelCls,
    row: rowCls,
    row3: row3Cls,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/70 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-edge bg-surface">
        <div className="sticky top-0 flex items-center justify-between border-b border-edge bg-surface px-6 py-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-fg">
            {editing ? "Edit Product" : "Add Product"}
          </h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-fg"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6">
          <Field label="Product name *">
            <input className={cls.input} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Intel Core Ultra 9 285K" />
          </Field>

          <div className={cls.row}>
            <Field label="Brand *">
              <input className={cls.input} value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Intel" />
            </Field>
            <Field label="Category *">
              <select className={cls.input} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">— Select —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea className={`${cls.input} resize-none`} rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Optional" />
          </Field>

          {/* Image */}
          <div>
            <label className={cls.label}>Product image</label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-edge bg-surface">
                {preview ? (
                  <Image src={preview} alt="preview" width={80} height={80} className="h-full w-full object-contain p-1" />
                ) : editing?.thumbnailUrl ? (
                  <Image src={editing.thumbnailUrl} alt="current" width={80} height={80} className="h-full w-full object-contain p-1" />
                ) : (
                  <span className="text-3xs text-subtle">No image</span>
                )}
              </div>
              {isAdmin ? (
                <>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="inline-flex items-center gap-2 border border-edge px-4 py-2 text-sm font-bold uppercase tracking-wider text-secondary hover:border-brand/40 hover:text-brand disabled:opacity-50">
                    <Upload size={13} /> {uploading ? "Uploading…" : "Upload"}
                  </button>
                </>
              ) : (
                <p className="text-xs text-subtle">Only admins can upload images — ask an admin to add one after review.</p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className={`${cls.row3} border-y border-edge py-4`}>
            <Field label="Cost price (VND)">
              <input type="number" min={0} step="1000" className={cls.input} value={form.costPrice ?? ""} onChange={(e) => set("costPrice", e.target.value ? Number(e.target.value) : undefined)} placeholder="12000000" />
              {form.costPrice && form.price > 0 && (
                <p className="mt-1 text-xs text-brand">
                  Margin: {Math.round((1 - form.costPrice / form.price) * 100)}%
                </p>
              )}
            </Field>
            <Field label="Selling price (VND) *">
              <input type="number" min={0} step="1000" className={cls.input} value={form.price || ""} onChange={(e) => set("price", Number(e.target.value))} placeholder="16000000" />
            </Field>
            <Field label="Sale price (VND)">
              <input type="number" min={0} step="1000" className={cls.input} value={form.salePrice ?? ""} onChange={(e) => set("salePrice", e.target.value ? Number(e.target.value) : undefined)} placeholder="Leave empty if none" />
            </Field>
          </div>
          <div className="border-b border-edge pb-4">
            <Field label="Stock">
              <input type="number" min={0} className={cls.input} value={form.stock ?? 0} onChange={(e) => set("stock", Number(e.target.value))} />
            </Field>
          </div>

          {/* Spec section */}
          <ProductSpecFields specKey={specKey} specFields={specFields} setSpec={setSpec} />

          {isAdmin ? (
            <label className="flex items-center gap-2 text-sm text-secondary">
              <input type="checkbox" className="accent-brand" checked={form.isPublished ?? true} onChange={(e) => set("isPublished", e.target.checked)} />
              Published
            </label>
          ) : (
            <p className="rounded border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              Product will be saved as draft and requires admin approval before going live.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="border border-edge px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-secondary hover:border-fg hover:text-fg">Cancel</button>
            <button type="submit" disabled={saving} className="bg-brand px-6 py-2.5 text-sm font-black uppercase tracking-wider text-black hover:bg-brand/85 disabled:opacity-50">
              {saving ? "Saving…" : editing ? "Update" : isAdmin ? "Create" : "Submit for Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
