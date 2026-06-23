"use client";

import { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import {
  fetchAdminOrders, updateOrderStatus, downloadOrdersExcel,
  type AdminOrder, type Paginated,
} from "@/lib/api";
import { formatVnd } from "@/lib/format";

const STATUSES = ["PENDING", "PAYMENT_FAILED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-yellow-400", PAYMENT_FAILED: "text-red-400",
  PROCESSING: "text-blue-400", SHIPPED: "text-brand",
  DELIVERED: "text-emerald-400", CANCELLED: "text-muted", RETURNED: "text-orange-400",
};

export default function AdminOrdersPage() {
  const [data, setData] = useState<Paginated<AdminOrder> | null>(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchAdminOrders(filter, page));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(id: string, status: string) {
    try {
      await updateOrderStatus(id, status);
      toast.success("Order status updated");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function exportExcel() {
    setExporting(true);
    try {
      await downloadOrdersExcel();
      toast.success("Report downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black uppercase tracking-wide text-white">Orders</h1>
        <button onClick={exportExcel} disabled={exporting} className="inline-flex items-center gap-2 border border-emerald-700/50 bg-emerald-950/30 px-4 py-2.5 text-[12px] font-black uppercase tracking-wider text-emerald-400 hover:bg-emerald-950/50 disabled:opacity-50">
          <FileSpreadsheet size={14} /> {exporting ? "Exporting…" : "Export Excel"}
        </button>
      </div>

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => { setFilter(""); setPage(1); }} className={`border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${!filter ? "border-brand text-brand" : "border-zinc-700 text-secondary"}`}>All</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }} className={`border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${filter === s ? "border-brand text-brand" : "border-zinc-700 text-secondary"}`}>{s}</button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-edge bg-elevated">
        <table className="w-full text-[13px]">
          <thead className="border-b border-edge text-[10px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Paid</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-subtle">Loading…</td></tr>
            ) : !data?.items.length ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-subtle">No orders.</td></tr>
            ) : (
              data.items.map((o) => (
                <tr key={o.id} className="border-b border-edge/50">
                  <td className="px-4 py-3 font-mono text-secondary">#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <p className="text-white">{o.user?.fullName ?? "—"}</p>
                    <p className="text-[11px] text-subtle">{o.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-secondary">{o.items.length} item(s)</td>
                  <td className="px-4 py-3 text-right font-bold text-white">{formatVnd(o.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={o.isPaid ? "text-emerald-400" : "text-subtle"}>{o.isPaid ? "Paid" : "Unpaid"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => changeStatus(o.id, e.target.value)}
                      className={`border border-zinc-700 bg-zinc-900 px-2 py-1 text-[12px] font-bold outline-none ${STATUS_COLOR[o.status] ?? "text-zinc-300"}`}
                    >
                      {STATUSES.map((s) => <option key={s} value={s} className="text-white">{s}</option>)}
                    </select>
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
          <span className="text-[12px] text-muted">Page {data.page} / {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="border border-zinc-700 px-3 py-1.5 text-[12px] text-zinc-300 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
