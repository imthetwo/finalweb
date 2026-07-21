import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  createAdminProduct,
  updateAdminProduct,
  fetchCategories,
  uploadProductImage,
  type AdminProduct,
  type ProductInput,
  type Category,
} from "@/lib/api";
import { useAuthState } from "@/hooks/useAuthState";
import { NAME_TO_SPEC } from "../components/ProductSpecFields";
import type { SpecKey } from "../types";

const BASE_EMPTY: Omit<ProductInput, SpecKey> = {
  categoryId: "", name: "", brand: "", description: "", price: 0,
  salePrice: undefined, stock: 10, isPublished: true,
};

// Data/logic for the admin product create/edit modal — form state, category
// list, image upload, spec-field prefill on edit, and save. The component
// only renders the form based on this.
export function useProductFormModal({
  editing, defaultCategoryId, onClose, onSaved,
}: {
  editing: AdminProduct | null;
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuthState();
  const isAdmin = user?.role === "ADMIN";
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

  // Mirrors CreateProductDto/UpdateProductDto (server/src/admin/dto/admin-product.dto.ts)
  // so bad input gets a friendly inline message instead of a raw toast from the API.
  function validate(): string | null {
    if (!form.categoryId) return "Please choose a category";
    const name = form.name.trim();
    if (name.length < 2 || name.length > 200) return "Name must be between 2 and 200 characters";
    const brand = form.brand.trim();
    if (brand.length < 1 || brand.length > 100) return "Brand must be between 1 and 100 characters";
    if ((form.description ?? "").length > 5000) return "Description must be under 5000 characters";
    if (!Number.isFinite(form.price) || form.price <= 0) return "Please enter a valid price";
    if (form.salePrice != null && form.salePrice > 0 && form.salePrice >= form.price) {
      return "Sale price must be lower than the regular price";
    }
    if (form.stock != null && (form.stock < 0 || form.stock > 100_000)) return "Stock must be between 0 and 100,000";
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const error = validate();
    if (error) { toast.error(error); return; }

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

  return {
    isAdmin, categories, form, set, specFields, setSpec, specKey,
    saving, preview, uploading, fileRef, onUpload, submit,
  };
}
