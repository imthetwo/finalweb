import { create } from "zustand";
import type { ApiPart } from "@/features/custom-lab";

type BuilderState = {
  // ── Data ──────────────────────────────────────────────────────
  selected:    Record<string, ApiPart | null>;   // slot → chosen part
  parts:       Record<string, ApiPart[]>;        // slot → list of parts from the DB
  loading:     Record<string, boolean>;          // slot → currently loading
  catMap:      Record<string, string>;           // category name → id
  pickerSlot:  string | null;                    // slot with the picker open
  addingCart:  boolean;

  // ── Computed (via selector) ─────────────────────────────────────
  // totalPrice, estimatedWatts, compat → computed in the component via selector

  // ── Actions ───────────────────────────────────────────────────
  setCatMap:      (map: Record<string, string>) => void;
  setParts:       (slot: string, items: ApiPart[]) => void;
  setLoading:     (slot: string, val: boolean) => void;
  openPicker:     (slot: string) => void;
  closePicker:    () => void;
  selectPart:     (slot: string, part: ApiPart) => void;
  removePart:     (slot: string) => void;
  setAddingCart:  (val: boolean) => void;
  resetBuild:     () => void;
};

export const useBuilderStore = create<BuilderState>((set) => ({
  selected:   {},
  parts:      {},
  loading:    {},
  catMap:     {},
  pickerSlot: null,
  addingCart: false,

  setCatMap:     (map)        => set({ catMap: map }),
  setParts:      (slot, items) => set((s) => ({ parts:   { ...s.parts,   [slot]: items } })),
  setLoading:    (slot, val)   => set((s) => ({ loading: { ...s.loading, [slot]: val  } })),
  openPicker:    (slot)        => set({ pickerSlot: slot }),
  closePicker:   ()            => set({ pickerSlot: null }),
  selectPart:    (slot, part)  => set((s) => ({ selected: { ...s.selected, [slot]: part } })),
  removePart:    (slot)        => set((s) => ({ selected: { ...s.selected, [slot]: null } })),
  setAddingCart: (val)         => set({ addingCart: val }),
  resetBuild:    ()            => set({ selected: {} }),
}));

// ── Selectors (used in components to avoid extra re-renders) ──
export const selectTotalPrice = (s: BuilderState) =>
  Object.values(s.selected).reduce((sum, p) => sum + (p?.displayPrice ?? 0), 0);

export const selectSelectedCount = (s: BuilderState) =>
  Object.values(s.selected).filter(Boolean).length;
