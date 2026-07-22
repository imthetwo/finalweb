"use client";

import {
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";

import { useOrdersManager } from "../hooks/useOrdersManager";
import {
  formatVnd,
  ORDER_STATUS_TEXT_CLASS as STATUS_COLOR,
} from "@/lib/format";

const ASSIGNABLE_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
const FILTER_STATUSES = [
  "AWAITING_CONFIRMATION",
  ...ASSIGNABLE_STATUSES,
  "CANCELLED",
];

export function OrdersManager() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const {
    isAdmin,
    canAccept,
    data,
    filter,
    query,
    page,
    loading,
    changingId,
    exporting,
    setPage,
    setFilter,
    setQuery,
    changeStatus,
    handleAccept,
    handleReject,
    handleCancel,
    handleRefund,
    handleRecheckPayment,
    exportExcel,
  } = useOrdersManager();

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black uppercase tracking-wide text-fg">
          Orders
        </h1>
        {isAdmin && (
          <button
            onClick={exportExcel}
            disabled={exporting}
            className="inline-flex items-center gap-2 border border-emerald-700/50 bg-emerald-950/30 px-4 py-2.5 text-sm font-black uppercase tracking-wider text-success hover:bg-emerald-950/50 disabled:opacity-50"
          >
            <FileSpreadsheet size={14} />{" "}
            {exporting ? "Exporting…" : "Export Excel"}
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["", ...FILTER_STATUSES].map((s) => (
          <button
            key={s || "all"}
            onClick={() => {
              setFilter(s);
              setPage(1);
            }}
            className={`border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${filter === s ? "border-brand text-brand" : "border-edge text-secondary"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Support lookup — find an order by ID, customer name, phone, or email */}
      <div className="mb-4 flex items-center gap-2 border border-edge bg-surface px-3 py-2 lg:w-96">
        <Search size={14} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order ID, customer name, phone, or email…"
          className="flex-1 bg-transparent text-body text-fg outline-none placeholder:text-subtle"
        />
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
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-subtle">
                  Loading…
                </td>
              </tr>
            ) : !data?.items.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-subtle">
                  No orders.
                </td>
              </tr>
            ) : (
              data.items.map((o) => {
                const isFinal =
                  o.status === "CANCELLED" || o.status === "DELIVERED";
                const busy = changingId === o.id;
                return (
                  <tr key={o.id} className="border-b border-edge/50">
                    <td className="px-4 py-3 font-mono text-secondary">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-fg">
                        {o.user?.fullName ?? o.shippingInfo.recipient}
                      </p>
                      <p className="text-xs text-subtle">
                        {o.user?.email ?? o.guestEmail ?? "no email"} ·{" "}
                        {o.shippingInfo.phone}
                      </p>
                      {!o.user && (
                        <p className="text-2xs uppercase tracking-wider text-warning">
                          Guest
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-secondary">
                      {o.items.length} item(s)
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-fg">
                      {formatVnd(o.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      {o.status === "CANCELLED" ? (
                        <span className="text-subtle">—</span>
                      ) : o.refundedAt ? (
                        <span className="text-orange-400">Refunded</span>
                      ) : o.paymentMethod === "COD" ? (
                        // COD's isPaid is set true at order creation just to mean
                        // "no gateway step needed" — cash hasn't actually changed
                        // hands until the courier delivers it, so only call it
                        // "Paid" once the order reaches DELIVERED.
                        <span className={o.status === "DELIVERED" ? "text-success" : "text-muted"}>
                          {o.status === "DELIVERED" ? "Paid (COD)" : "COD"}
                        </span>
                      ) : (
                        <span
                          className={o.isPaid ? "text-success" : "text-subtle"}
                        >
                          {o.isPaid ? "Paid" : "Unpaid"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {o.status === "CANCELLED" ||
                      o.status === "AWAITING_CONFIRMATION" ? (
                        <span className={STATUS_COLOR[o.status]}>
                          {o.status.replace("_", " ")}
                        </span>
                      ) : (
                        <select
                          value={o.status}
                          onChange={(e) => changeStatus(o.id, e.target.value)}
                          disabled={busy || isFinal}
                          className={`border border-edge bg-surface px-2 py-1 text-sm font-bold outline-none disabled:opacity-50 ${STATUS_COLOR[o.status] ?? "text-secondary"}`}
                        >
                          {ASSIGNABLE_STATUSES.map((s) => (
                            <option key={s} value={s} className="text-fg">
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {o.status === "AWAITING_CONFIRMATION" ? (
                        <div className="flex items-center gap-2">
                          {canAccept && (
                            <button
                              onClick={() => handleAccept(o.id)}
                              disabled={busy}
                              title="Confirm inventory is available and accept this order"
                              className="inline-flex items-center gap-1 border border-edge px-2 py-1 text-xs font-bold uppercase tracking-wider text-secondary hover:border-success/40 hover:text-success disabled:opacity-50"
                            >
                              <CheckCircle2 size={12} /> Accept
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleReject(o.id)}
                              disabled={busy}
                              title="Reject — refunds via MoMo first if it was paid"
                              className="inline-flex items-center gap-1 border border-edge px-2 py-1 text-xs font-bold uppercase tracking-wider text-secondary hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          )}
                        </div>
                      ) : (
                        isAdmin && (
                          <div className="flex items-center gap-2">
                            {o.paymentMethod === "MOMO" &&
                              !o.isPaid &&
                              o.status !== "CANCELLED" && (
                                <button
                                  onClick={() => handleRecheckPayment(o.id)}
                                  disabled={busy}
                                  title="Recheck payment status against MoMo"
                                  className="inline-flex items-center gap-1 border border-edge px-2 py-1 text-xs font-bold uppercase tracking-wider text-secondary hover:border-brand/40 hover:text-brand disabled:opacity-50"
                                >
                                  <RefreshCw size={12} /> Recheck payment
                                </button>
                              )}
                            {!isFinal &&
                            o.paymentMethod === "MOMO" &&
                            o.isPaid ? (
                              <button
                                onClick={() => handleRefund(o.id)}
                                disabled={busy}
                                title="Refund via MoMo, then cancel + restock"
                                className="inline-flex items-center gap-1 border border-edge px-2 py-1 text-xs font-bold uppercase tracking-wider text-secondary hover:border-orange-400/40 hover:text-orange-400 disabled:opacity-50"
                              >
                                <RotateCcw size={12} /> Refund
                              </button>
                            ) : (
                              !isFinal && (
                                <button
                                  onClick={() => handleCancel(o.id)}
                                  disabled={busy}
                                  className="inline-flex items-center gap-1 border border-edge px-2 py-1 text-xs font-bold uppercase tracking-wider text-secondary hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                                >
                                  <XCircle size={12} /> Cancel
                                </button>
                              )
                            )}
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="border border-edge px-3 py-1.5 text-sm text-secondary disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-muted">
            Page {data.page} / {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border border-edge px-3 py-1.5 text-sm text-secondary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
