"use client";
// "use client" vì: useState (filter, page, loading), useCallback, event handlers (changeStatus, exportExcel, pagination)

import { useCallback, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import {
  fetchAdminOrders, updateOrderStatus, downloadOrdersExcel,
  type AdminOrder, type Paginated,
} from "@/lib/api";
import { useCRUDManager } from "@/features/admin/hooks/useCRUDManager";
import { formatVnd } from "@/lib/format";

const STATUSES = ["PENDING", "PAYMENT_FAILED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-warning", PAYMENT_FAILED: "text-destructive",
  PROCESSING: "text-info", SHIPPED: "text-brand",
  DELIVERED: "text-success", CANCELLED: "text-muted", RETURNED: "text-orange-400",
};

export function OrdersManager() {
  const [exporting, setExporting] = useState(false);
  const [changingId, setChangingId] = useState<string | null>(null);

  const { data, search: filter, page, loading, reload, setPage, handleSearch: setFilter } =
    useCRUDManager<AdminOrder>(useCallback(
      (s, p) => fetchAdminOrders(s, p),
      [],
    ));

  async function changeStatus(id: string, status: string) {
    setChangingId(id);
    try {
      await updateOrderStatus(id, status);
      toast.success("Order status updated");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setChangingId(null);
    }
  }

  async function exportExcel() {
    setExporting(true);
    try { await downloadOrdersExcel(); toast.success("Report downloaded"); }
    catch { toast.error("Export failed"); }
    finally { setExporting(false); }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black uppercase tracking-wide text-fg">Orders</h1>
        <button onClick={exportExcel} disabled={exporting}
          className="inline-flex items-center gap-2 border border-emerald-700/50 bg-emerald-950/30 px-4 py-2.5 text-sm font-black uppercase tracking-wider text-success hover:bg-emerald-950/50 disabled:opacity-50">
          <FileSpreadsheet size={14} /> {exporting ? "Exporting…" : "Export Excel"}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["", ...STATUSES].map((s) => (
          <button key={s || "all"} onClick={() => { setFilter(s); setPage(1); }}
            className={`border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${filter === s ? "border-brand text-brand" : "border-edge text-secondary"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="border border-edge bg-elevated">
        <table className="w-full text-body">
          <thead className="border-b border-edge text-2xs uppercase tracking-wider text-muted">
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
            ) : data.items.map((o) => (
              <tr key={o.id} className="border-b border-edge/50">
                <td className="px-4 py-3 font-mono text-secondary">#{o.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-4 py-3">
                  <p className="text-fg">{o.user?.fullName ?? "—"}</p>
                  <p className="text-xs text-subtle">{o.user?.email}</p>
                </td>
                <td className="px-4 py-3 text-secondary">{o.items.length} item(s)</td>
                <td className="px-4 py-3 text-right font-bold text-fg">{formatVnd(o.totalAmount)}</td>
                <td className="px-4 py-3">
                  <span className={o.isPaid ? "text-success" : "text-subtle"}>{o.isPaid ? "Paid" : "Unpaid"}</span>
                </td>
                <td className="px-4 py-3">
                  <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}
                    disabled={changingId === o.id}
                    className={`border border-edge bg-surface px-2 py-1 text-sm font-bold outline-none disabled:opacity-50 ${STATUS_COLOR[o.status] ?? "text-secondary"}`}>
                    {STATUSES.map((s) => <option key={s} value={s} className="text-fg">{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
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
    </div>
  );
}
