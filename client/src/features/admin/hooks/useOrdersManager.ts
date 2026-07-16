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

  return {
    isAdmin, canAccept,
    data, filter, page, loading, changingId, exporting,
    setPage, setFilter, reload,
    changeStatus, handleAccept, handleReject, handleCancel, handleRefund, handleRecheckPayment, exportExcel,
  };
}
