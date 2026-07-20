import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import {
  fetchAdminProducts,
  deleteAdminProduct,
  fetchCategories,
  type AdminProduct,
  type Category,
} from "@/lib/api";
import { useAuthState } from "@/hooks/useAuthState";
import { useCRUDManager } from "./useCRUDManager";

// Data/logic for the per-category admin product list — composes the shared
// useCRUDManager (list/search/pagination) with the category header, delete and
// the create/edit modal state. The component only renders.
export function useProductCategoryManager() {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const { user } = useAuthState();
  const isAdmin = user?.role === "ADMIN";

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories()
      .then((cats) => { const cat = cats.find((c) => c.id === categoryId); if (cat) setCategory(cat); })
      .catch(() => {});
  }, [categoryId]);

  // fetchFn captures categoryId — useCRUDManager re-runs when categoryId changes
  const crud = useCRUDManager<AdminProduct>(useCallback(
    (s, p) => fetchAdminProducts(s, p, categoryId),
    [categoryId],
  ));

  async function remove(p: AdminProduct) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    setRemovingId(p.id);
    try {
      await deleteAdminProduct(p.id);
      toast.success("Deleted");
      crud.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setRemovingId(null);
    }
  }

  return {
    isAdmin,
    categoryId,
    title: category?.name ?? "Products",
    ...crud,
    modalOpen, setModalOpen,
    editing, setEditing,
    removingId, remove,
  };
}
