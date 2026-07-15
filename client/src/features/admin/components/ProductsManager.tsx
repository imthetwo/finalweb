"use client";
// "use client" vì: useState, useCallback, useEffect, event handlers (CRUD, pagination)

import Image from "next/image";
import { Plus, Pencil, Trash2, Search, Upload, Download, CheckCircle, FileSpreadsheet } from "lucide-react";

import { formatVnd } from "@/lib/format";
import ProductFormModal from "./ProductFormModal";
import { useProductsManager } from "../hooks/useProductsManager";

export function ProductsManager() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const {
    isAdmin,
    data, search, page, loading, reload, setPage, handleSearch,
    modalOpen, setModalOpen, editing,
    removingId, approvingId, importing, exportingReport, importRef,
    onImport, remove, openCreate, openEdit, approve, exportInventory, downloadTemplate,
  } = useProductsManager();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black uppercase tracking-wide text-fg">Products</h1>
        <div className="flex items-center gap-2">
          <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={onImport} className="hidden" />
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 border border-edge px-4 py-2.5 text-sm font-black uppercase tracking-wider text-secondary hover:border-brand/50 hover:text-brand"
          >
            <Download size={14} /> Template
          </button>
          {isAdmin && (
            <button onClick={exportInventory} disabled={exportingReport} className="inline-flex items-center gap-2 border border-emerald-700/50 bg-emerald-950/30 px-4 py-2.5 text-sm font-black uppercase tracking-wider text-success hover:bg-emerald-950/50 disabled:opacity-50">
              <FileSpreadsheet size={14} /> {exportingReport ? "Exporting…" : "Inventory Report"}
            </button>
          )}
          <button onClick={() => importRef.current?.click()} disabled={importing} className="inline-flex items-center gap-2 border border-emerald-700/50 bg-emerald-950/30 px-4 py-2.5 text-sm font-black uppercase tracking-wider text-success hover:bg-emerald-950/50 disabled:opacity-50">
            <Upload size={14} />
            {importing ? "Importing…" : isAdmin ? "Import Excel" : "Import Excel (Draft)"}
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 text-sm font-black uppercase tracking-wider text-black hover:bg-brand/85">
            <Plus size={14} /> {isAdmin ? "Add Product" : "Submit for Review"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 border border-edge bg-surface px-3 py-2 lg:w-80">
        <Search size={14} className="text-muted" />
        <input
          value={search}
          onChange={(e) => { handleSearch(e.target.value); }}
          placeholder="Search by name, SKU, brand…"
          className="flex-1 bg-transparent text-body text-fg outline-none placeholder:text-subtle"
        />
      </div>

      {/* Table */}
      <div className="border border-edge bg-elevated">
        <table className="w-full text-body">
          <thead className="border-b border-edge text-2xs uppercase tracking-wider text-muted">
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
                  <td className="px-4 py-2.5 text-secondary">{p.category?.name ?? "—"}</td>
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
                    {p.isPublished ? (
                      <span className="text-2xs font-bold uppercase text-success">Live</span>
                    ) : (
                      <span className="inline-block rounded bg-yellow-900/30 px-2 py-0.5 text-2xs font-bold uppercase text-warning">
                        Draft · Chờ duyệt
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {isAdmin ? (
                      <div className="flex items-center justify-end gap-1.5">
                        {!p.isPublished && (
                          <button onClick={() => approve(p)} disabled={approvingId === p.id} className="flex h-7 items-center gap-1 border border-emerald-700/50 bg-emerald-950/30 px-2 text-2xs font-black uppercase text-success hover:bg-emerald-950/60 disabled:opacity-40" aria-label="Approve">
                            <CheckCircle size={11} /> {approvingId === p.id ? "…" : "Approve"}
                          </button>
                        )}
                        <button onClick={() => openEdit(p)} className="flex h-7 w-7 items-center justify-center border border-edge text-secondary hover:border-brand/50 hover:text-brand" aria-label="Edit"><Pencil size={12} /></button>
                        <button onClick={() => remove(p)} disabled={removingId === p.id} className="flex h-7 w-7 items-center justify-center border border-red-800/40 text-destructive hover:border-destructive disabled:opacity-40" aria-label="Delete"><Trash2 size={12} /></button>
                      </div>
                    ) : (
                      <span className="text-2xs text-subtle">View only</span>
                    )}
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
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="border border-edge px-3 py-1.5 text-sm text-secondary disabled:opacity-40">Prev</button>
          <span className="text-sm text-muted">Page {data.page} / {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="border border-edge px-3 py-1.5 text-sm text-secondary disabled:opacity-40">Next</button>
        </div>
      )}

      {modalOpen && (
        <ProductFormModal editing={editing} onClose={() => setModalOpen(false)} onSaved={reload} />
      )}
    </div>
  );
}
