import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import {
  fetchAdminProducts, deleteAdminProduct, approveAdminProduct, importProductsExcel,
  downloadProductTemplate, downloadInventoryReport,
  type AdminProduct,
} from "@/lib/api";
import { useAuthState } from "@/hooks/useAuthState";
import { confirmDialog } from "@/store/confirmStore";
import { useCRUDManager } from "./useCRUDManager";

// Data/logic for the admin Products manager — composes useCRUDManager with the
// role check, Excel import/template/inventory export, delete, approve and the
// create/edit modal state. The component only renders.
export function useProductsManager() {
  const { user } = useAuthState();
  const isAdmin = user?.role === "ADMIN";
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const crud = useCRUDManager<AdminProduct>(useCallback(
    (s, p) => fetchAdminProducts(s, p),
    [],
  ));

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await importProductsExcel(file);
      toast.success(`Imported: ${res.created} created, ${res.updated} updated`);
      if (res.errors.length) toast.message(`${res.errors.length} row(s) had errors`);
      crud.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = "";
    }
  }

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

  function downloadTemplate() {
    downloadProductTemplate().catch(() => toast.error("Download failed"));
  }

  return {
    isAdmin,
    ...crud,
    modalOpen, setModalOpen, editing,
    removingId, approvingId, importing, exportingReport, importRef,
    onImport, remove, openCreate, openEdit, approve, exportInventory, downloadTemplate,
  };
}
