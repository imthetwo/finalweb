"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import { useBuilderStore } from "@/store/builderStore";
import { checkCompatibility } from "../utils/checkCompatibility";
import { BUILD_SLOTS } from "../constants";

// Custom hook #2 — derives the compatibility result live from whatever's
// selected right now (checkCompatibility is pure/synchronous), so a warning
// only clears once the build actually no longer has that problem — not just
// because some other part changed. "Validate" is now just a manual re-check
// with a toast summary; the StatusBar/warning list update automatically either way.
export function useBuildValidation() {
  const selected = useBuilderStore((s) => s.selected);

  const compat = useMemo(() => checkCompatibility(selected), [selected]);

  const validateBuild = useCallback(() => {
    const items = Object.entries(selected).filter(([, p]) => p);
    if (items.length < 2) { toast.message("Select at least 2 parts to validate."); return; }

    if (compat.valid) {
      if (compat.warnings.length) {
        toast.success("Build compatible (with warnings)");
      } else if (items.length >= BUILD_SLOTS.length) {
        toast.success("Build fully compatible!");
      } else {
        // Nothing conflicts among the parts picked so far, but the build isn't
        // complete — don't claim it's "fully" compatible yet.
        toast.success(`No conflicts so far (${items.length}/${BUILD_SLOTS.length} parts)`);
      }
    } else
      toast.error(`${compat.errors.length} compatibility issue${compat.errors.length > 1 ? "s" : ""} found`);
  }, [selected, compat]);

  return { compat, validateBuild };
}
