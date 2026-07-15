"use client";

import { useMemo } from "react";

import { useBuilderStore, selectTotalPrice, selectSelectedCount } from "@/store/builderStore";
import { BUILD_SLOTS } from "../constants";
import { usePartCatalog } from "./usePartCatalog";
import { useBuildValidation } from "./useBuildValidation";
import { useBuildCart } from "./useBuildCart";

// Composition hook — the public API for the builder UI. It stitches together the
// three focused hooks (catalog, validation, cart) plus the core store state and
// derived values, keeping the exact same return shape its consumers rely on.
export function useBuild() {
  // ── Core state + actions from the store ─────────────────────────
  const selected = useBuilderStore((s) => s.selected);
  const { selectPart, removePart, resetBuild } = useBuilderStore.getState();

  // ── Derived values ──────────────────────────────────────────────
  const totalPrice    = useBuilderStore(selectTotalPrice);
  const selectedCount = useBuilderStore(selectSelectedCount);

  // p.wattage is only ever populated for PSU parts (from psuSpec.wattage) —
  // that's the PSU's own rated *capacity*, not something it draws, so it must
  // never be summed into total system power draw (matches checkCompatibility.ts).
  const estimatedWatts = useMemo(
    () => BUILD_SLOTS.reduce((sum, cfg) => {
      const p = selected[cfg.slot];
      return sum + (p ? (p.tdp ?? cfg.defaultWatts) : 0);
    }, 0),
    [selected],
  );

  // ── Focused hooks ───────────────────────────────────────────────
  const { parts, loading, pickerSlot, openPicker, closePicker } = usePartCatalog();
  const { compat, validating, validateBuild } = useBuildValidation();
  const { addingCart, addAllToCart, saveBuild } = useBuildCart();

  return {
    // State
    selected, parts, loading, pickerSlot, compat,
    validating, saving: false, addingCart,
    // Derived
    totalPrice, estimatedWatts, selectedCount,
    // Actions
    openPicker, closePicker, selectPart, removePart, resetBuild,
    validateBuild, addAllToCart, saveBuild,
  };
}
