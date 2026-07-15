import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  fetchAdminPromotions, createAdminPromotion, updateAdminPromotion, deleteAdminPromotion,
  type Promotion, type PromotionInput,
} from "@/lib/api";

const EMPTY: PromotionInput = {
  title: "",
  actionLabel: "",
  href: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
  sortOrder: 0,
};

// Data/logic for the admin Promotions/Banners manager — list load, create/edit
// modal state, save, toggle-active and delete. The component only renders.
export function usePromotionsManager() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<PromotionInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // `load` just bumps a key; the effect below does the actual fetch so all
  // setState happens inside async callbacks (avoids the set-state-in-effect lint).
  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    fetchAdminPromotions()
      .then((d) => { if (active) setItems(d); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(p: Promotion) {
    setEditing(p);
    setForm({
      title: p.title,
      actionLabel: p.actionLabel ?? "",
      href: p.href ?? "",
      startsAt: p.startsAt ? p.startsAt.slice(0, 16) : "",
      endsAt: p.endsAt ? p.endsAt.slice(0, 16) : "",
      isActive: p.isActive,
      sortOrder: p.sortOrder,
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload: PromotionInput = {
        ...form,
        actionLabel: form.actionLabel || undefined,
        href: form.href || undefined,
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined,
      };
      if (editing) {
        await updateAdminPromotion(editing.id, payload);
        toast.success("Banner updated");
      } else {
        await createAdminPromotion(payload);
        toast.success("Banner created");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Promotion) {
    setTogglingId(p.id);
    try {
      await updateAdminPromotion(p.id, { isActive: !p.isActive });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setTogglingId(null);
    }
  }

  async function remove(p: Promotion) {
    if (!confirm(`Delete banner "${p.title}"?`)) return;
    setRemovingId(p.id);
    try {
      await deleteAdminPromotion(p.id);
      toast.success("Banner deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setRemovingId(null);
    }
  }

  return {
    items, loading,
    modalOpen, setModalOpen,
    editing, form, setForm, saving, togglingId, removingId,
    openCreate, openEdit, save, toggleActive, remove,
  };
}
