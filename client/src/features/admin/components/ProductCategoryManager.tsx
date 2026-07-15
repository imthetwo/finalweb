"use client";

import Image from "next/image";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import { formatVnd } from "@/lib/format";
import ProductFormModal from "./ProductFormModal";
import { useProductCategoryManager } from "../hooks/useProductCategoryManager";

export function ProductCategoryManager() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const {
    categoryId, title,
    data, search, page, loading, reload, setPage, handleSearch,
    modalOpen, setModalOpen, editing, setEditing, removingId, remove,
  } = useProductCategoryManager();

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black uppercase tracking-wide text-fg">{title}</h1>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 text-sm font-black uppercase tracking-wider text-brand-fg hover:bg-brand-hover"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 border border-edge bg-surface px-3 py-2 lg:w-80">
        <Search size={14} className="text-muted" />
        <input
          value={search}
          onChange={(e) => { handleSearch(e.target.value); }}
          placeholder="Search…"
          className="flex-1 bg-transparent text-body text-fg outline-none placeholder:text-subtle"
        />
      </div>

      <div className="overflow-x-auto border border-edge bg-elevated">
        <table className="w-full text-body">
          <thead className="border-b border-edge text-2xs uppercase tracking-wider text-muted">
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
              <tr><td colSpan={5} className="px-4 py-10 text-center text-subtle">Loading…</td></tr>
            ) : !data?.items.length ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-subtle">No products found.</td></tr>
            ) : (
              data.items.map((p) => (
                <tr key={p.id} className="border-b border-edge/50 hover:bg-white/2">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 border border-edge bg-surface">
                        {p.thumbnailUrl && (
                          <Image src={p.thumbnailUrl} alt={p.name} width={40} height={40} className="h-full w-full object-contain p-1" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">{p.name}</p>
                        <p className="text-xs text-muted">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {p.salePrice ? (
                      <div>
                        <span className="text-xs text-subtle line-through">{formatVnd(p.price)}</span>
                        <p className="font-bold text-brand">{formatVnd(p.salePrice)}</p>
                      </div>
                    ) : (
                      <span className="font-bold text-fg">{formatVnd(p.price)}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={p.stock <= 5 ? "text-warning" : "text-secondary"}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-2xs font-bold uppercase ${p.isPublished ? "text-success" : "text-subtle"}`}>
                      {p.isPublished ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => { setEditing(p); setModalOpen(true); }} className="flex h-7 w-7 items-center justify-center border border-edge text-secondary hover:border-brand/50 hover:text-brand" aria-label="Edit">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => remove(p)} disabled={removingId === p.id} className="flex h-7 w-7 items-center justify-center border border-red-800/40 text-destructive hover:border-destructive disabled:opacity-40" aria-label="Delete">
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
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="border border-edge px-3 py-1.5 text-sm text-secondary disabled:opacity-40">Prev</button>
          <span className="text-sm text-muted">Page {data.page} / {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="border border-edge px-3 py-1.5 text-sm text-secondary disabled:opacity-40">Next</button>
        </div>
      )}

      {modalOpen && (
        <ProductFormModal
          editing={editing}
          defaultCategoryId={categoryId}
          onClose={() => setModalOpen(false)}
          onSaved={reload}
        />
      )}
    </div>
  );
}
