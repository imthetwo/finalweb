"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BUILD_SLOTS } from "../constants";
import { useBuild } from "./useBuild";

// Data/logic for the builder page — wraps useBuild() with the page's own
// concerns: syncing the picker overlay to a `?picking=` URL param (so browser
// back closes it / returns here instead of to home) and the reset confirm.
// The component only renders based on this.
export function useCustomLabBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pickingParam = searchParams.get("picking");

  const {
    selected, parts, loading, pickerSlot, compat,
    validating, addingCart,
    totalPrice, estimatedWatts, selectedCount,
    openPicker: rawOpenPicker,
    closePicker: storeClosePicker,
    selectPart, removePart, resetBuild,
    validateBuild, addAllToCart,
  } = useBuild();

  const handleReset = useCallback(() => {
    if (selectedCount === 0) return;
    if (confirm("Reset the build? This removes every part you've added.")) resetBuild();
  }, [selectedCount, resetBuild]);

  // When browser back removes ?picking from URL, close the overlay in store
  const prevPickingParam = useRef(pickingParam);
  useEffect(() => {
    if (prevPickingParam.current !== null && pickingParam === null) {
      storeClosePicker();
    }
    prevPickingParam.current = pickingParam;
  }, [pickingParam, storeClosePicker]);

  // Push URL when opening so browser back returns to /custom-lab (not home)
  const openPicker = useCallback(async (slot: string) => {
    await rawOpenPicker(slot);
    router.push(`/custom-lab?picking=${slot}`);
  }, [rawOpenPicker, router]);

  // Close overlay immediately + navigate back to remove ?picking from URL
  const closePicker = useCallback(() => {
    storeClosePicker();
    router.back();
  }, [storeClosePicker, router]);

  const pickerCfg = BUILD_SLOTS.find((s) => s.slot === pickerSlot);

  return {
    selected, parts, loading, pickerSlot, pickerCfg, compat,
    validating, addingCart,
    totalPrice, estimatedWatts, selectedCount,
    openPicker, closePicker,
    selectPart, removePart, handleReset,
    validateBuild, addAllToCart,
  };
}
