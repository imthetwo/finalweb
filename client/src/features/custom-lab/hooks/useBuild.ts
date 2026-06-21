"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import type { ApiPart, CompatibilityResult } from "../types";
import { BUILD_SLOTS, MOCK_PARTS } from "../constants";

export function useBuild() {
  const [selected,   setSelected]   = useState<Record<string, ApiPart | null>>({});
  const [parts,      setParts]      = useState<Record<string, ApiPart[]>>({});
  const [loading,    setLoading]    = useState<Record<string, boolean>>({});
  const [pickerSlot, setPickerSlot] = useState<string | null>(null);
  const [compat,     setCompat]     = useState<CompatibilityResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [addingCart, setAddingCart] = useState(false);

  // Load parts for a slot from API, fallback to mock data
  const loadParts = useCallback(async (slot: string) => {
    if (parts[slot]) return;
    setLoading((p) => ({ ...p, [slot]: true }));
    try {
      const data = await apiFetch<{ items: ApiPart[] }>(`/custom-lab/parts?slot=${slot}`);
      setParts((p) => ({ ...p, [slot]: data.items?.length ? data.items : (MOCK_PARTS[slot] ?? []) }));
    } catch {
      setParts((p) => ({ ...p, [slot]: MOCK_PARTS[slot] ?? [] }));
    } finally {
      setLoading((p) => ({ ...p, [slot]: false }));
    }
  }, [parts]);

  const openPicker = useCallback(async (slot: string) => {
    await loadParts(slot);
    setPickerSlot(slot);
  }, [loadParts]);

  const closePicker = useCallback(() => setPickerSlot(null), []);

  const selectPart = useCallback((slot: string, part: ApiPart) => {
    setSelected((p) => ({ ...p, [slot]: part }));
    setCompat(null);
  }, []);

  const removePart = useCallback((slot: string) => {
    setSelected((p) => ({ ...p, [slot]: null }));
    setCompat(null);
  }, []);

  const validateBuild = useCallback(async () => {
    const items = Object.entries(selected)
      .filter(([, p]) => p)
      .map(([slot, p]) => ({ slot, productId: p!.id }));
    if (items.length < 2) { toast.message("Select at least 2 parts to validate."); return; }
    setValidating(true);
    try {
      const res = await apiFetch<CompatibilityResult>("/custom-lab/validate", {
        method: "POST",
        body: JSON.stringify({ items }),
      });
      setCompat(res);
      if (res.valid) toast.success("Build is compatible!");
      else toast.error(`${res.errors.length} compatibility errors.`);
    } catch {
      setCompat({ valid: true, errors: [], warnings: [] });
      toast.success("(Offline) OK — no simulated errors.");
    } finally {
      setValidating(false);
    }
  }, [selected]);

  const addAllToCart = useCallback(async () => {
    const items = Object.entries(selected).filter(([, p]) => p).map(([slot, p]) => ({ slot, productId: p!.id }));
    if (!items.length) { toast.error("No parts selected."); return; }
    if (!localStorage.getItem("access_token")) { toast.error("Please sign in."); return; }
    setAddingCart(true);
    try {
      const build = await apiFetch<{ id: string }>("/custom-lab/builds", {
        method: "POST",
        body: JSON.stringify({ name: `My Build — ${new Date().toLocaleDateString("vi-VN")}`, items }),
      });
      await apiFetch(`/cart/builds/${build.id}`, { method: "POST" });
      toast.success(`Added ${items.length} parts to cart.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add to cart.");
    } finally {
      setAddingCart(false);
    }
  }, [selected]);

  const saveBuild = useCallback(async () => {
    const items = Object.entries(selected).filter(([, p]) => p).map(([slot, p]) => ({ slot, productId: p!.id }));
    if (!items.length) { toast.error("No parts selected."); return; }
    setSaving(true);
    try {
      const res = await apiFetch<{ id: string }>("/custom-lab/builds", {
        method: "POST",
        body: JSON.stringify({ name: `My Build — ${new Date().toLocaleDateString("vi-VN")}`, items }),
      });
      toast.success(`Build saved! ID: ${res.id}`);
    } catch {
      toast.error("Could not save — check connection.");
    } finally {
      setSaving(false);
    }
  }, [selected]);

  const totalPrice = useMemo(
    () => Object.values(selected).reduce((s, p) => s + (p?.displayPrice ?? 0), 0),
    [selected],
  );

  const estimatedWatts = useMemo(
    () => BUILD_SLOTS.reduce((sum, cfg) => {
      const p = selected[cfg.slot];
      return sum + (p ? (p.tdp ?? p.wattage ?? cfg.defaultWatts) : 0);
    }, 0),
    [selected],
  );

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return {
    selected, parts, loading, pickerSlot, compat,
    validating, saving, addingCart,
    totalPrice, estimatedWatts, selectedCount,
    openPicker, closePicker, selectPart, removePart,
    validateBuild, addAllToCart, saveBuild,
  };
}
