"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { X, Upload } from "lucide-react";

import {
  createAdminProduct,
  updateAdminProduct,
  fetchCategories,
  uploadProductImage,
  type AdminProduct,
  type ProductInput,
  type Category,
} from "@/lib/api";
import {
  ProductSpecFields,
  Field,
  inputCls,
  labelCls,
  NAME_TO_SPEC,
  type SpecKey,
} from "@/features/admin/components/ProductSpecFields";

const rowCls = "grid grid-cols-2 gap-4";
const row3Cls = "grid grid-cols-3 gap-4";

const BASE_EMPTY: Omit<ProductInput, SpecKey> = {
  categoryId: "", name: "", brand: "", description: "", price: 0,
  salePrice: undefined, stock: 10, isPublished: true,
};

export default function ProductFormModal({
  editing, defaultCategoryId, onClose, onSaved,
}: {
  editing: AdminProduct | null;
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  // Initialize the form straight from the `editing` prop. The modal is mounted
  // fresh each time it opens (parent renders it behind `{modalOpen && …}`), so a
  // lazy initializer is enough — no effect needed to sync state from the prop.
  const [form, setForm] = useState<Omit<ProductInput, SpecKey>>(() =>
    editing
      ? {
          categoryId: editing.category?.id ?? "",
          name: editing.name,
          brand: editing.brand,
          description: editing.description ?? "",
          imageUrl: editing.imageUrl ?? undefined,
          price: editing.price,
          salePrice: editing.salePrice ?? undefined,
          stock: editing.stock,
          isPublished: editing.isPublished,
        }
      : { ...BASE_EMPTY, categoryId: defaultCategoryId ?? "" }
  );
  const [specFields, setSpecFields] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedCat = categories.find((c) => c.id === form.categoryId);
  const specKey = selectedCat ? NAME_TO_SPEC[selectedCat.name.toLowerCase()] : undefined;

  // Load categories. When editing, prefill the spec fields once the category
  // list is known — done inside the async callback (not synchronously in the
  // effect body) so it doesn't trigger the cascading-render lint.
  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        setCategories(cats);
        if (!editing) return;
        const cat = cats.find((c) => c.id === editing.category?.id);
        const sk = cat ? NAME_TO_SPEC[cat.name.toLowerCase()] : undefined;
        if (!sk) return;
        const specData = editing[sk] as Record<string, unknown> | undefined;
        if (!specData) return;
        const flat: Record<string, string | number | boolean> = {};
        for (const [k, v] of Object.entries(specData)) {
          if (v !== null && v !== undefined && k !== "id" && k !== "productId") {
            flat[k] = v as string | number | boolean;
          }
        }
        setSpecFields(flat);
      })
      .catch(() => setCategories([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevCatId = useRef(form.categoryId);
  useEffect(() => {
    if (form.categoryId && form.categoryId !== prevCatId.current) {
      setSpecFields({});
      prevCatId.current = form.categoryId;
    }
  }, [form.categoryId]);

  function set<K extends keyof typeof BASE_EMPTY>(key: K, val: (typeof BASE_EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  function setSpec(key: string, val: string | number | boolean) {
    setSpecFields((f) => ({ ...f, [key]: val }));
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadProductImage(file);
      set("imageUrl", url);
      setPreview(url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryId) { toast.error("Please choose a category"); return; }
    if (!form.name || form.price <= 0) { toast.error("Name and a valid price are required"); return; }

    setSaving(true);
    try {
      const payload: ProductInput = {
        ...form,
        salePrice: form.salePrice && form.salePrice > 0 ? form.salePrice : undefined,
        ...(specKey && Object.keys(specFields).length > 0 ? { [specKey]: specFields } : {}),
      };
      if (editing) {
        await updateAdminProduct(editing.id, payload);
        toast.success("Product updated");
      } else {
        await createAdminProduct(payload);
        toast.success("Product created");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

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
                  <span className="text-[9px] text-subtle">No image</span>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="inline-flex items-center gap-2 border border-edge px-4 py-2 text-sm font-bold uppercase tracking-wider text-secondary hover:border-brand/40 hover:text-brand disabled:opacity-50">
                <Upload size={13} /> {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>

          {/* Pricing */}
          <div className={`${cls.row3} border-y border-edge py-4`}>
            <Field label="Cost price (VND)">
              <input type="number" min={0} className={cls.input} value={form.costPrice ?? ""} onChange={(e) => set("costPrice", e.target.value ? Number(e.target.value) : undefined)} placeholder="12000000" />
              {form.costPrice && form.price > 0 && (
                <p className="mt-1 text-xs text-brand">
                  Margin: {Math.round((1 - form.costPrice / form.price) * 100)}%
                </p>
              )}
            </Field>
            <Field label="Selling price (VND) *">
              <input type="number" min={0} className={cls.input} value={form.price || ""} onChange={(e) => set("price", Number(e.target.value))} placeholder="15990000" />
            </Field>
            <Field label="Sale price (VND)">
              <input type="number" min={0} className={cls.input} value={form.salePrice ?? ""} onChange={(e) => set("salePrice", e.target.value ? Number(e.target.value) : undefined)} placeholder="Leave empty if none" />
            </Field>
          </div>
          <div className="border-b border-edge pb-4">
            <Field label="Stock">
              <input type="number" min={0} className={cls.input} value={form.stock ?? 0} onChange={(e) => set("stock", Number(e.target.value))} />
            </Field>
          </div>

          {/* Spec section */}
          <ProductSpecFields specKey={specKey} specFields={specFields} setSpec={setSpec} />

          <label className="flex items-center gap-2 text-sm text-secondary">
            <input type="checkbox" className="accent-brand" checked={form.isPublished ?? true} onChange={(e) => set("isPublished", e.target.checked)} />
            Published
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="border border-edge px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-secondary hover:border-fg hover:text-fg">Cancel</button>
            <button type="submit" disabled={saving} className="bg-brand px-6 py-2.5 text-sm font-black uppercase tracking-wider text-black hover:bg-brand/85 disabled:opacity-50">
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
