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

// Map category name → spec key
type SpecKey = "cpuSpec" | "gpuSpec" | "ramSpec" | "motherboardSpec" | "psuSpec" | "caseSpec" | "coolerSpec" | "monitorSpec" | "storageSpec" | "laptopSpec";

const NAME_TO_SPEC: Record<string, SpecKey> = {
  "processors (cpu)": "cpuSpec",
  "processors": "cpuSpec",
  "cpu": "cpuSpec",
  "graphics cards (gpu)": "gpuSpec",
  "graphics cards": "gpuSpec",
  "gpu": "gpuSpec",
  "ram": "ramSpec",
  "motherboards": "motherboardSpec",
  "power supplies": "psuSpec",
  "pc cases": "caseSpec",
  "cpu coolers": "coolerSpec",
  "gaming monitors": "monitorSpec",
  "storage (ssd/hdd)": "storageSpec",
  "storage": "storageSpec",
  "laptops": "laptopSpec",
};

const SPEC_LABELS: Record<SpecKey, string> = {
  cpuSpec: "CPU Specs", gpuSpec: "GPU Specs", ramSpec: "RAM Specs",
  motherboardSpec: "Motherboard Specs", psuSpec: "PSU Specs", caseSpec: "Case Specs",
  coolerSpec: "Cooler Specs", monitorSpec: "Monitor Specs", storageSpec: "Storage Specs",
  laptopSpec: "Laptop Specs",
};

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
  const [form, setForm] = useState<Omit<ProductInput, SpecKey>>({ ...BASE_EMPTY });
  const [specFields, setSpecFields] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedCat = categories.find((c) => c.id === form.categoryId);
  const specKey = selectedCat ? NAME_TO_SPEC[selectedCat.name.toLowerCase()] : undefined;

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (editing) {
      setForm({
        categoryId: editing.category?.id ?? "",
        name: editing.name,
        brand: editing.brand,
        description: editing.description ?? "",
        imageUrl: editing.imageUrl ?? undefined,
        price: editing.price,
        salePrice: editing.salePrice ?? undefined,
        stock: editing.stock,
        isPublished: editing.isPublished,
      });
      setPreview(null);
    } else {
      setForm({ ...BASE_EMPTY, categoryId: defaultCategoryId ?? "" });
      setSpecFields({});
      setPreview(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  // Prefill spec fields when editing
  useEffect(() => {
    if (editing && categories.length) {
      const cat = categories.find((c) => c.id === editing.category?.id);
      if (cat) {
        const sk = NAME_TO_SPEC[cat.name.toLowerCase()];
        if (sk) {
          const specData = editing[sk] as Record<string, unknown> | undefined;
          if (specData) {
            const flat: Record<string, string | number | boolean> = {};
            for (const [k, v] of Object.entries(specData)) {
              if (v !== null && v !== undefined && k !== "id" && k !== "productId") {
                flat[k] = v as string | number | boolean;
              }
            }
            setSpecFields(flat);
          }
        }
      }
    }
  }, [editing, categories]);

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
  function numSpec(key: string): number | "" {
    const v = specFields[key];
    return typeof v === "number" ? v : v !== undefined ? Number(v) || "" : "";
  }
  function strSpec(key: string): string {
    return specFields[key] !== undefined ? String(specFields[key]) : "";
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
    input: "w-full border border-edge bg-surface px-3 py-2 text-[13px] text-fg outline-none focus:border-brand/50 placeholder:text-subtle",
    label: "mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted",
    row: "grid grid-cols-2 gap-4",
    row3: "grid grid-cols-3 gap-4",
  };

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><label className={cls.label}>{label}</label>{children}</div>;
  }

  function i(key: string, placeholder?: string, type: "text" | "number" = "text") {
    return (
      <input
        type={type}
        className={cls.input}
        placeholder={placeholder}
        value={type === "number" ? numSpec(key) : strSpec(key)}
        onChange={(e) => setSpec(key, type === "number" ? (e.target.value ? Number(e.target.value) : 0) : e.target.value)}
      />
    );
  }

  function sel(key: string, opts: string[]) {
    return (
      <select className={cls.input} value={strSpec(key)} onChange={(e) => setSpec(key, e.target.value)}>
        <option value="">— Select —</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  function renderSpec() {
    if (!specKey) return null;
    const sections: Record<SpecKey, React.ReactNode> = {
      cpuSpec: (
        <div className={cls.row}>
          <Field label="Socket *">{sel("socket", ["AM5", "AM4", "LGA1700", "LGA1851"])}</Field>
          <Field label="Generation">{i("generation", "Ryzen 9000 / Core Ultra 200")}</Field>
          <Field label="Cores *">{i("cores", "8", "number")}</Field>
          <Field label="Threads *">{i("threads", "16", "number")}</Field>
          <Field label="Base clock (GHz) *">{i("baseClockGhz", "3.7", "number")}</Field>
          <Field label="Boost clock (GHz) *">{i("boostClockGhz", "5.5", "number")}</Field>
          <Field label="TDP (W) *">{i("tdp", "65", "number")}</Field>
          <Field label="L3 cache">{i("cacheL3", "32MB")}</Field>
        </div>
      ),
      gpuSpec: (
        <div className={cls.row}>
          <Field label="VRAM (GB) *">{i("vramGb", "16", "number")}</Field>
          <Field label="TDP (W) *">{i("tdp", "200", "number")}</Field>
          <Field label="Length (mm)">{i("lengthMm", "336", "number")}</Field>
          <Field label="PCIe gen">{i("pcieGen", "4", "number")}</Field>
          <Field label="Boost clock (MHz)">{i("boostClockMhz", "2610", "number")}</Field>
          <Field label="Memory type">{sel("memType", ["GDDR6", "GDDR6X", "GDDR7"])}</Field>
        </div>
      ),
      ramSpec: (
        <div className={cls.row}>
          <Field label="Capacity (GB) *">{i("capacityGb", "32", "number")}</Field>
          <Field label="Speed (MHz) *">{i("speedMhz", "6000", "number")}</Field>
          <Field label="Generation *">{sel("generation", ["DDR5", "DDR4"])}</Field>
          <Field label="Latency">{i("latency", "CL30")}</Field>
          <Field label="Kit">{i("kit", "2x16GB")}</Field>
        </div>
      ),
      motherboardSpec: (
        <div className={cls.row}>
          <Field label="Socket *">{sel("socket", ["AM5", "AM4", "LGA1700", "LGA1851"])}</Field>
          <Field label="Chipset">{i("chipset", "X670E / Z890")}</Field>
          <Field label="Form factor *">{sel("formFactor", ["ATX", "mATX", "ITX"])}</Field>
          <Field label="RAM gen *">{sel("ramGen", ["DDR5", "DDR4"])}</Field>
          <Field label="RAM slots *">{i("ramSlots", "4", "number")}</Field>
          <Field label="Max RAM (GB)">{i("maxRamGb", "192", "number")}</Field>
        </div>
      ),
      psuSpec: (
        <div className={cls.row}>
          <Field label="Wattage (W) *">{i("wattage", "850", "number")}</Field>
          <Field label="Efficiency">{sel("efficiency", ["80+ White", "80+ Bronze", "80+ Gold", "80+ Platinum", "80+ Titanium"])}</Field>
          <Field label="Modular">{sel("modular", ["Full", "Semi", "Non"])}</Field>
        </div>
      ),
      caseSpec: (
        <div className={cls.row}>
          <Field label="Form factor *">{sel("formFactor", ["ATX", "mATX", "ITX"])}</Field>
          <Field label="Max GPU length (mm)">{i("maxGpuLengthMm", "360", "number")}</Field>
          <Field label="Radiator support">{i("radiatorSupport", "360mm")}</Field>
          <Field label="Drive bays">{i("driveBays", "2", "number")}</Field>
        </div>
      ),
      coolerSpec: (
        <div className={cls.row}>
          <Field label="Type *">{sel("coolerType", ["Air", "AIO"])}</Field>
          <Field label="TDP rating (W)">{i("tdpRating", "250", "number")}</Field>
          <Field label="Radiator size (mm)">{sel("radiatorSizeMm", ["120", "240", "280", "360"])}</Field>
          <Field label="Socket support">{i("socketSupport", "AM5,LGA1700,LGA1851")}</Field>
        </div>
      ),
      monitorSpec: (
        <div className={cls.row}>
          <Field label="Size (in) *">{i("sizeIn", "27", "number")}</Field>
          <Field label="Resolution *">{i("resolution", "2560x1440")}</Field>
          <Field label="Refresh rate (Hz) *">{i("refreshRateHz", "165", "number")}</Field>
          <Field label="Panel type">{sel("panelType", ["IPS", "VA", "TN", "OLED"])}</Field>
          <Field label="Response (ms)">{i("responseMs", "1", "number")}</Field>
          <Field label="HDR">
            <select className={cls.input} value={specFields.hdr !== undefined ? String(specFields.hdr) : ""}
              onChange={(e) => setSpec("hdr", e.target.value === "true")}>
              <option value="">— Select —</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </Field>
        </div>
      ),
      storageSpec: (
        <div className={cls.row}>
          <Field label="Capacity (GB) *">{i("capacityGb", "1000", "number")}</Field>
          <Field label="Type *">{sel("storageType", ["NVMe", "SSD", "HDD"])}</Field>
          <Field label="Interface">{i("interfaceType", "PCIe 4.0")}</Field>
          <Field label="Read (MB/s)">{i("readMbps", "7000", "number")}</Field>
          <Field label="Write (MB/s)">{i("writeMbps", "6500", "number")}</Field>
        </div>
      ),
      laptopSpec: (
        <div className={cls.row}>
          <Field label="CPU *">{i("cpu", "Intel Core i7-13700H")}</Field>
          <Field label="GPU">{i("gpu", "RTX 4060")}</Field>
          <Field label="RAM (GB) *">{i("ramGb", "16", "number")}</Field>
          <Field label="Storage (GB) *">{i("storageGb", "512", "number")}</Field>
          <Field label="Display size (in) *">{i("displaySizeIn", "15.6", "number")}</Field>
          <Field label="Resolution">{i("displayResolution", "1920x1080")}</Field>
          <Field label="OS">{i("os", "Windows 11")}</Field>
        </div>
      ),
    };
    return (
      <div className="border border-edge p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-brand/70">{SPEC_LABELS[specKey]}</p>
        {sections[specKey]}
      </div>
    );
  }

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
                className="inline-flex items-center gap-2 border border-edge px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-secondary hover:border-brand/40 hover:text-brand disabled:opacity-50">
                <Upload size={13} /> {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>

          {/* Pricing */}
          <div className={`${cls.row3} border-y border-edge py-4`}>
            <Field label="Price (VND) *">
              <input type="number" min={0} className={cls.input} value={form.price || ""} onChange={(e) => set("price", Number(e.target.value))} placeholder="15490000" />
            </Field>
            <Field label="Sale price (VND)">
              <input type="number" min={0} className={cls.input} value={form.salePrice ?? ""} onChange={(e) => set("salePrice", e.target.value ? Number(e.target.value) : undefined)} placeholder="Optional" />
            </Field>
            <Field label="Stock">
              <input type="number" min={0} className={cls.input} value={form.stock ?? 0} onChange={(e) => set("stock", Number(e.target.value))} />
            </Field>
          </div>

          {/* Spec section */}
          {renderSpec()}

          <label className="flex items-center gap-2 text-[12px] text-secondary">
            <input type="checkbox" className="accent-[#00ffff]" checked={form.isPublished ?? true} onChange={(e) => set("isPublished", e.target.checked)} />
            Published
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="border border-edge px-5 py-2.5 text-[12px] font-bold uppercase tracking-wider text-secondary hover:border-white hover:text-fg">Cancel</button>
            <button type="submit" disabled={saving} className="bg-brand px-6 py-2.5 text-[12px] font-black uppercase tracking-wider text-black hover:bg-brand/85 disabled:opacity-50">
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
