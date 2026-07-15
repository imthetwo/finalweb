"use client";
// "use client" vì: useState (filter, page, loading), useCallback, event handlers (changeStatus, exportExcel, pagination)

import { useCallback, useState } from "react";
import { CheckCircle2, FileSpreadsheet, RefreshCw, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  fetchAdminOrders, updateOrderStatus, acceptOrder, rejectOrder, adminCancelOrder, recheckPayment, refundOrder, downloadOrdersExcel,
  type AdminOrder, type Paginated,
} from "@/lib/api";
import { useCRUDManager } from "@/features/admin/hooks/useCRUDManager";
import { useAuthState } from "@/hooks/useAuthState";
import { formatVnd } from "@/lib/format";

// Shipping-progress statuses only. CANCELLED and AWAITING_CONFIRMATION are
// deliberately not assignable from this dropdown — cancellation always goes
// through the dedicated Cancel action, and a fresh order can only leave
// AWAITING_CONFIRMATION via the dedicated Accept/Reject actions below.
const ASSIGNABLE_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
// Filter bar can still filter by every real status (viewing is fine for
// everyone) — this mirrors the real OrderStatus enum, unlike the previous
// list which included PAYMENT_FAILED/RETURNED values that don't exist in it.
const FILTER_STATUSES = ["AWAITING_CONFIRMATION", ...ASSIGNABLE_STATUSES, "CANCELLED"];

const STATUS_COLOR: Record<string, string> = {
  AWAITING_CONFIRMATION: "text-orange-400",
  PENDING: "text-warning", PROCESSING: "text-info", SHIPPED: "text-brand",
  DELIVERED: "text-success", CANCELLED: "text-muted",
};

export function OrdersManager() {
  const { user } = useAuthState();
  const isAdmin = user?.role === "ADMIN";
  const canAccept = isAdmin || user?.role === "STAFF";

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

  async function handleAccept(id: string) {
    setChangingId(id);
    try {
      await acceptOrder(id);
      toast.success("Order accepted");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Accept failed");
    } finally {
      setChangingId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt("Reason for rejecting this order (visible in server logs):");
    if (!reason || !reason.trim()) return;
    setChangingId(id);
    try {
      await rejectOrder(id, reason.trim());
      toast.success("Order rejected — refunded/cancelled and stock restored");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setChangingId(null);
    }
  }

  async function handleCancel(id: string) {
    const reason = window.prompt("Reason for cancelling this order (visible in server logs):");
    if (!reason || !reason.trim()) return;
    setChangingId(id);
    try {
      await adminCancelOrder(id, reason.trim());
      toast.success("Order cancelled and stock restored");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setChangingId(null);
    }
  }

  async function handleRefund(id: string) {
    const reason = window.prompt("Reason for this refund (visible in server logs):");
    if (!reason || !reason.trim()) return;
    setChangingId(id);
    try {
      await refundOrder(id, reason.trim());
      toast.success("Refunded via MoMo, order cancelled and stock restored");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setChangingId(null);
    }
  }

  async function handleRecheckPayment(id: string) {
    setChangingId(id);
    try {
      const res = await recheckPayment(id);
      toast[res.isPaid ? "success" : "info"](
        res.isPaid ? "Confirmed paid via MoMo" : `MoMo says: ${res.momoMessage}`,
      );
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Recheck failed");
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
        {["", ...FILTER_STATUSES].map((s) => (
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
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-subtle">Loading…</td></tr>
            ) : !data?.items.length ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-subtle">No orders.</td></tr>
            ) : data.items.map((o) => {
              const isFinal = o.status === "CANCELLED" || o.status === "DELIVERED";
              const busy = changingId === o.id;
              return (
                <tr key={o.id} className="border-b border-edge/50">
                  <td className="px-4 py-3 font-mono text-secondary">#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <p className="text-fg">{o.user?.fullName ?? o.shippingInfo.recipient}</p>
                    <p className="text-xs text-subtle">{o.user?.email ?? o.guestEmail ?? "no email"} · {o.shippingInfo.phone}</p>
                    {!o.user && <p className="text-2xs uppercase tracking-wider text-warning">Guest</p>}
                  </td>
                  <td className="px-4 py-3 text-secondary">{o.items.length} item(s)</td>
                  <td className="px-4 py-3 text-right font-bold text-fg">{formatVnd(o.totalAmount)}</td>
                  <td className="px-4 py-3">
                    {o.refundedAt ? (
                      <span className="text-orange-400">Refunded</span>
                    ) : (
                      <span className={o.isPaid ? "text-success" : "text-subtle"}>{o.isPaid ? "Paid" : "Unpaid"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {o.status === "CANCELLED" || o.status === "AWAITING_CONFIRMATION" ? (
                      <span className={STATUS_COLOR[o.status]}>{o.status.replace("_", " ")}</span>
                    ) : (
                      <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}
                        disabled={busy || isFinal}
                        className={`border border-edge bg-surface px-2 py-1 text-sm font-bold outline-none disabled:opacity-50 ${STATUS_COLOR[o.status] ?? "text-secondary"}`}>
                        {ASSIGNABLE_STATUSES.map((s) => <option key={s} value={s} className="text-fg">{s}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {o.status === "AWAITING_CONFIRMATION" ? (
                      <div className="flex items-center gap-2">
                        {canAccept && (
                          <button onClick={() => handleAccept(o.id)} disabled={busy}
                            title="Confirm inventory is available and accept this order"
                            className="inline-flex items-center gap-1 border border-edge px-2 py-1 text-xs font-bold uppercase tracking-wider text-secondary hover:border-success/40 hover:text-success disabled:opacity-50">
                            <CheckCircle2 size={12} /> Accept
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => handleReject(o.id)} disabled={busy}
                            title="Reject — refunds via MoMo first if it was paid"
                            className="inline-flex items-center gap-1 border border-edge px-2 py-1 text-xs font-bold uppercase tracking-wider text-secondary hover:border-destructive/40 hover:text-destructive disabled:opacity-50">
                            <XCircle size={12} /> Reject
                          </button>
                        )}
                      </div>
                    ) : isAdmin && (
                      <div className="flex items-center gap-2">
                        {o.paymentMethod === "MOMO" && !o.isPaid && o.status !== "CANCELLED" && (
                          <button onClick={() => handleRecheckPayment(o.id)} disabled={busy}
                            title="Recheck payment status against MoMo"
                            className="inline-flex items-center gap-1 border border-edge px-2 py-1 text-xs font-bold uppercase tracking-wider text-secondary hover:border-brand/40 hover:text-brand disabled:opacity-50">
                            <RefreshCw size={12} /> Recheck payment
                          </button>
                        )}
                        {!isFinal && o.paymentMethod === "MOMO" && o.isPaid ? (
                          <button onClick={() => handleRefund(o.id)} disabled={busy}
                            title="Refund via MoMo, then cancel + restock"
                            className="inline-flex items-center gap-1 border border-edge px-2 py-1 text-xs font-bold uppercase tracking-wider text-secondary hover:border-orange-400/40 hover:text-orange-400 disabled:opacity-50">
                            <RotateCcw size={12} /> Refund
                          </button>
                        ) : !isFinal && (
                          <button onClick={() => handleCancel(o.id)} disabled={busy}
                            className="inline-flex items-center gap-1 border border-edge px-2 py-1 text-xs font-bold uppercase tracking-wider text-secondary hover:border-destructive/40 hover:text-destructive disabled:opacity-50">
                            <XCircle size={12} /> Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
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
