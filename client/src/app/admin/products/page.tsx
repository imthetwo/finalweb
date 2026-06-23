"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Search, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  fetchAdminProducts, deleteAdminProduct, importProductsExcel,
  type AdminProduct, type Paginated,
} from "@/lib/api";
import { formatVnd } from "@/lib/format";
import ProductFormModal from "@/features/admin/ProductFormModal";

export default function AdminProductsPage() {
  const [data, setData] = useState<Paginated<AdminProduct> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importProductsExcel(file);
      toast.success(`Imported: ${res.created} created, ${res.updated} updated`);
      if (res.errors.length) toast.message(`${res.errors.length} row(s) had errors`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchAdminProducts(search, page));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  async function remove(p: AdminProduct) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await deleteAdminProduct(p.id);
      toast.success("Product deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(p: AdminProduct) { setEditing(p); setModalOpen(true); }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black uppercase tracking-wide text-white">Products</h1>
        <div className="flex items-center gap-2">
          <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={onImport} className="hidden" />
          <button onClick={() => importRef.current?.click()} className="inline-flex items-center gap-2 border border-emerald-700/50 bg-emerald-950/30 px-4 py-2.5 text-[12px] font-black uppercase tracking-wider text-emerald-400 hover:bg-emerald-950/50">
            <Upload size={14} /> Import Excel
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 text-[12px] font-black uppercase tracking-wider text-black hover:bg-brand/85">
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-2 lg:w-80">
        <Search size={14} className="text-muted" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, SKU, brand…"
          className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-subtle"
        />
      </div>

      {/* Table */}
      <div className="border border-edge bg-[#111]">
        <table className="w-full text-[13px]">
          <thead className="border-b border-edge text-[10px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-center">Stock</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-subtle">Loading…</td></tr>
            ) : !data?.items.length ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-subtle">No products found.</td></tr>
            ) : (
              data.items.map((p) => (
                <tr key={p.id} className="border-b border-edge/50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 border border-edge bg-zinc-900">
                        {p.thumbnailUrl && (
                          <Image src={p.thumbnailUrl} alt={p.name} width={40} height={40} className="h-full w-full object-contain p-1" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{p.name}</p>
                        <p className="text-[11px] text-muted">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-secondary">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    {p.salePrice ? (
                      <div>
                        <span className="text-[11px] text-subtle line-through">{formatVnd(p.price)}</span>
                        <p className="font-bold text-brand">{formatVnd(p.salePrice)}</p>
                      </div>
                    ) : (
                      <span className="font-bold text-white">{formatVnd(p.price)}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={p.stock <= 5 ? "text-yellow-400" : "text-zinc-300"}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[10px] font-bold uppercase ${p.isPublished ? "text-emerald-400" : "text-subtle"}`}>
                      {p.isPublished ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(p)} className="flex h-7 w-7 items-center justify-center border border-zinc-700 text-secondary hover:border-brand/50 hover:text-brand" aria-label="Edit"><Pencil size={12} /></button>
                      <button onClick={() => remove(p)} className="flex h-7 w-7 items-center justify-center border border-red-800/40 text-red-500 hover:border-red-500" aria-label="Delete"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="border border-zinc-700 px-3 py-1.5 text-[12px] text-zinc-300 disabled:opacity-40">Prev</button>
          <span className="text-[12px] text-muted">Page {data.page} / {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="border border-zinc-700 px-3 py-1.5 text-[12px] text-zinc-300 disabled:opacity-40">Next</button>
        </div>
      )}

      {modalOpen && (
        <ProductFormModal editing={editing} onClose={() => setModalOpen(false)} onSaved={load} />
      )}
    </div>
  );
}
