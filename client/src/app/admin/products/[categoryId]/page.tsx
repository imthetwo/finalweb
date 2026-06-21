"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

import {
  fetchAdminProducts,
  deleteAdminProduct,
  fetchCategories,
  type AdminProduct,
  type Paginated,
  type Category,
} from "@/lib/api";
import { formatVnd } from "@/lib/format";
import ProductFormModal from "@/features/admin/ProductFormModal";

export default function AdminProductCategoryPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;

  const [data, setData] = useState<Paginated<AdminProduct> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        const cat = cats.find((c) => c.id === categoryId);
        if (cat) setCategory(cat);
      })
      .catch(() => {});
  }, [categoryId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchAdminProducts(search, page, categoryId));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [search, page, categoryId]);

  useEffect(() => { setPage(1); }, [categoryId]);
  useEffect(() => { load(); }, [load]);

  async function remove(p: AdminProduct) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await deleteAdminProduct(p.id);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const title = category?.name ?? "Products";

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black uppercase tracking-wide text-white">{title}</h1>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 text-[12px] font-black uppercase tracking-wider text-brand-fg hover:bg-brand-hover"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-2 lg:w-80">
        <Search size={14} className="text-zinc-500" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search…"
          className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-zinc-600"
        />
      </div>

      <div className="overflow-x-auto border border-zinc-800 bg-elevated">
        <table className="w-full text-[13px]">
          <thead className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-center">Stock</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-zinc-600">Loading…</td></tr>
            ) : !data?.items.length ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-zinc-600">No products found.</td></tr>
            ) : (
              data.items.map((p) => (
                <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-white/2">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 border border-zinc-800 bg-zinc-900">
                        {p.thumbnailUrl && (
                          <Image src={p.thumbnailUrl} alt={p.name} width={40} height={40} className="h-full w-full object-contain p-1" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{p.name}</p>
                        <p className="text-[11px] text-zinc-500">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {p.salePrice ? (
                      <div>
                        <span className="text-[11px] text-zinc-600 line-through">{formatVnd(p.price)}</span>
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
                    <span className={`text-[10px] font-bold uppercase ${p.isPublished ? "text-emerald-400" : "text-zinc-600"}`}>
                      {p.isPublished ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => { setEditing(p); setModalOpen(true); }} className="flex h-7 w-7 items-center justify-center border border-zinc-700 text-zinc-400 hover:border-brand/50 hover:text-brand" aria-label="Edit">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => remove(p)} className="flex h-7 w-7 items-center justify-center border border-red-800/40 text-red-500 hover:border-red-500" aria-label="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="border border-zinc-700 px-3 py-1.5 text-[12px] text-zinc-300 disabled:opacity-40">Prev</button>
          <span className="text-[12px] text-zinc-500">Page {data.page} / {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="border border-zinc-700 px-3 py-1.5 text-[12px] text-zinc-300 disabled:opacity-40">Next</button>
        </div>
      )}

      {modalOpen && (
        <ProductFormModal
          editing={editing}
          defaultCategoryId={categoryId}
          onClose={() => setModalOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
