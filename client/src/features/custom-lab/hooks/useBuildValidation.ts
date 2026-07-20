"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import { useBuilderStore } from "@/store/builderStore";
import { checkCompatibility } from "../utils/checkCompatibility";
import { BUILD_SLOTS } from "../constants";

// Custom hook #2 — wraps the pure checkCompatibility() with the UI side effects:
// the validating flag, storing the result, and success/error toasts.
export function useBuildValidation() {
  const compat     = useBuilderStore((s) => s.compat);
  const validating = useBuilderStore((s) => s.validating);
  const selected   = useBuilderStore((s) => s.selected);

  const { setCompat, setValidating } = useBuilderStore.getState();

  const validateBuild = useCallback(async () => {
    const items = Object.entries(selected).filter(([, p]) => p);
    if (items.length < 2) { toast.message("Select at least 2 parts to validate."); return; }
    setValidating(true);

    const result = checkCompatibility(selected);
    setCompat(result);

    if (result.valid) {
      if (result.warnings.length) {
        toast.success("Build compatible (with warnings)");
      } else if (items.length >= BUILD_SLOTS.length) {
        toast.success("Build fully compatible!");
      } else {
        // Nothing conflicts among the parts picked so far, but the build isn't
        // complete — don't claim it's "fully" compatible yet.
        toast.success(`No conflicts so far (${items.length}/${BUILD_SLOTS.length} parts)`);
      }
    } else
      toast.error(`${result.errors.length} compatibility issue${result.errors.length > 1 ? "s" : ""} found`);

    setValidating(false);
  }, [selected, setCompat, setValidating]);

  return { compat, validating, validateBuild };
}
