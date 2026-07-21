import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  fetchAdminOrders, updateOrderStatus, acceptOrder, rejectOrder, adminCancelOrder, recheckPayment, refundOrder, downloadOrdersExcel,
  type AdminOrder,
} from "@/lib/api";
import { useCRUDManager } from "@/features/admin/hooks/useCRUDManager";
import { useAuthState } from "@/hooks/useAuthState";

// Data/logic for the admin Orders table — list/filter/pagination plus every
// order-mutating action (status change, accept/reject, cancel, refund,
// recheck payment, Excel export). The component only renders based on this.
export function useOrdersManager() {
  const { user } = useAuthState();
  const isAdmin = user?.role === "ADMIN";
  const canAccept = isAdmin || user?.role === "STAFF";

  const [exporting, setExporting] = useState(false);
  const [changingId, setChangingId] = useState<string | null>(null);
  // Separate from `filter` (status buttons) — free-text lookup by customer
  // name/phone/email, for support to find an order when the caller lost
  // their order ID.
  const [query, setQuery] = useState("");

  const { data, search: filter, page, loading, reload, setPage, handleSearch: setFilter } =
    useCRUDManager<AdminOrder>(useCallback(
      (s, p) => fetchAdminOrders(s, p, query),
      [query],
    ));

  function setQueryAndResetPage(q: string) {
    setQuery(q);
    setPage(1);
  }

  // Mirrors the backend's CancelOrderDto.reason constraint (@Length(3, 300))
  // so a too-short prompt() answer gets a friendly toast instead of the raw
  // class-validator message.
  function promptForReason(message: string): string | null {
    const reason = window.prompt(message)?.trim();
    if (!reason) return null;
    if (reason.length < 3 || reason.length > 300) {
      toast.error("Reason must be between 3 and 300 characters");
      return null;
    }
    return reason;
  }

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
    const reason = promptForReason("Reason for rejecting this order (visible in server logs):");
    if (!reason) return;
    setChangingId(id);
    try {
      await rejectOrder(id, reason);
      toast.success("Order rejected — refunded/cancelled and stock restored");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setChangingId(null);
    }
  }

  async function handleCancel(id: string) {
    const reason = promptForReason("Reason for cancelling this order (visible in server logs):");
    if (!reason) return;
    setChangingId(id);
    try {
      await adminCancelOrder(id, reason);
      toast.success("Order cancelled and stock restored");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setChangingId(null);
    }
  }

  async function handleRefund(id: string) {
    const reason = promptForReason("Reason for this refund (visible in server logs):");
    if (!reason) return;
    setChangingId(id);
    try {
      await refundOrder(id, reason);
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

  return {
    isAdmin, canAccept,
    data, filter, query, page, loading, changingId, exporting,
    setPage, setFilter, setQuery: setQueryAndResetPage, reload,
    changeStatus, handleAccept, handleReject, handleCancel, handleRefund, handleRecheckPayment, exportExcel,
  };
}
