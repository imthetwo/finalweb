"use client";

import { useMemo } from "react";

import { useBuilderStore } from "@/store/builderStore";
import { checkCompatibility } from "../utils/checkCompatibility";

// Custom hook #2 — derives the compatibility result live from whatever's
// selected right now (checkCompatibility is pure/synchronous), so a warning
// only clears once the build actually no longer has that problem — not just
// because some other part changed.
export function useBuildValidation() {
  const selected = useBuilderStore((s) => s.selected);

  const compat = useMemo(() => checkCompatibility(selected), [selected]);

  return { compat };
}
