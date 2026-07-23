import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  fetchAdminProducts, deleteAdminProduct, approveAdminProduct, downloadInventoryReport,
  type AdminProduct,
} from "@/lib/api";
import { useAuthState } from "@/hooks/useAuthState";
import { confirmDialog } from "@/store/confirmStore";
import { useCRUDManager } from "./useCRUDManager";

// Data/logic for the admin Products manager — composes useCRUDManager with the
// role check, inventory export, delete, approve and the create/edit modal state.
// The component only renders.
export function useProductsManager() {
  const { user } = useAuthState();
  const isAdmin = user?.role === "ADMIN";
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [exportingReport, setExportingReport] = useState(false);

  const crud = useCRUDManager<AdminProduct>(useCallback(
    (s, p) => fetchAdminProducts(s, p),
    [],
  ));

  async function remove(p: AdminProduct) {
    if (!(await confirmDialog(`Delete "${p.name}"?`))) return;
    setRemovingId(p.id);
    try {
      await deleteAdminProduct(p.id);
      toast.success("Product deleted");
      crud.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setRemovingId(null);
    }
  }

  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(p: AdminProduct) { setEditing(p); setModalOpen(true); }

  async function approve(p: AdminProduct) {
    setApprovingId(p.id);
    try {
      await approveAdminProduct(p.id);
      toast.success(`"${p.name}" approved and published`);
      crud.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setApprovingId(null);
    }
  }

  async function exportInventory() {
    setExportingReport(true);
    try {
      await downloadInventoryReport();
      toast.success("Inventory report downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportingReport(false);
    }
  }

  return {
    isAdmin,
    ...crud,
    modalOpen, setModalOpen, editing,
    removingId, approvingId, exportingReport,
    remove, openCreate, openEdit, approve, exportInventory,
  };
}
