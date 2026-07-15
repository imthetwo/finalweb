"use client";

import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api/client";
import { fetchCategories } from "@/lib/api/products";
import { useBuilderStore } from "@/store/builderStore";
import type { ApiPart } from "../types";

const SLOT_TO_CATEGORY: Record<string, string> = {
  MOTHERBOARD:  "Motherboards",
  CPU:          "Processors (CPU)",
  MEMORY:       "RAM",
  SSD_STORAGE:  "Storage (SSD/HDD)",
  HDD_STORAGE:  "Storage (SSD/HDD)",
  POWER_SUPPLY: "Power Supplies",
  GPU:          "Graphics Cards (GPU)",
  CASE:         "PC Cases",
  MONITOR:      "Gaming Monitors",
  CPU_COOLER:   "CPU Coolers",
  KEYBOARD:     "Mechanical Keyboards",
  MOUSE:        "Gaming Mice",
  HEADSET:      "Gaming Headsets",
  CASE_FAN:     "Case Fans",
};

// SSD_STORAGE and HDD_STORAGE share one DB category (Storage (SSD/HDD)) — this
// filters by the real StorageSpec.storageType field so each slot only shows
// its own kind instead of both slots showing every storage product.
const SLOT_TO_STORAGE_TYPE: Record<string, string> = {
  SSD_STORAGE: "NVMe,SSD",
  HDD_STORAGE: "HDD",
};

// Custom hook #1 — loads the part catalog (category map + parts-per-slot from the
// DB) and drives the part-picker overlay open/close.
export function usePartCatalog() {
  const parts      = useBuilderStore((s) => s.parts);
  const loading    = useBuilderStore((s) => s.loading);
  const catMap     = useBuilderStore((s) => s.catMap);
  const pickerSlot = useBuilderStore((s) => s.pickerSlot);

  const { setCatMap, setParts, setLoading, openPicker: storeOpenPicker, closePicker } =
    useBuilderStore.getState();

  // ── Tải category map 1 lần khi mount ────────────────────────────
  useEffect(() => {
    if (Object.keys(catMap).length) return;
    fetchCategories()
      .then((cats) => {
        const map: Record<string, string> = {};
        for (const cat of cats) map[cat.name] = cat.id;
        setCatMap(map);
      })
      .catch(() => toast.error("Failed to load part categories — please refresh"));
  }, [catMap, setCatMap]);

  // ── Async: load parts từ DB theo slot ───────────────────────────
  const loadParts = useCallback(async (slot: string) => {
    if (parts[slot]) return;
    setLoading(slot, true);
    try {
      const categoryId = catMap[SLOT_TO_CATEGORY[slot]];
      if (!categoryId) { setParts(slot, []); return; }

      const storageType = SLOT_TO_STORAGE_TYPE[slot];
      const query = new URLSearchParams({ categoryId, limit: '50' });
      if (storageType) query.set('storageType', storageType);

      const data = await apiFetch<{
        items: Array<{
          id: string; name: string; brand: string;
          displayPrice: number; thumbnailUrl: string | null;
          cpuSpec?:         { socket?: string; tdp?: number } | null;
          gpuSpec?:         { tdp?: number; lengthMm?: number | null } | null;
          ramSpec?:         { generation?: string; speedMhz?: number } | null;
          motherboardSpec?: { socket?: string; ramGen?: string; formFactor?: string; ramSlots?: number; maxRamGb?: number | null } | null;
          psuSpec?:         { wattage?: number } | null;
          caseSpec?:        { formFactor?: string; maxGpuLengthMm?: number | null } | null;
          coolerSpec?:      { socketSupport?: string | null; tdpRating?: number | null } | null;
          storageSpec?:     { capacityGb?: number | null; interfaceType?: string | null } | null;
        }>;
      }>(`/products?${query.toString()}`);

      const mapped: ApiPart[] = data.items.map((p) => ({
        id: p.id, name: p.name, brand: p.brand,
        displayPrice: p.displayPrice, thumbnailUrl: p.thumbnailUrl,
        tdp:            p.cpuSpec?.tdp ?? p.gpuSpec?.tdp ?? p.coolerSpec?.tdpRating,
        wattage:        p.psuSpec?.wattage,
        socket:         p.cpuSpec?.socket ?? p.motherboardSpec?.socket,
        ramGen:         p.motherboardSpec?.ramGen ?? p.ramSpec?.generation,
        ramSpeedMhz:    p.ramSpec?.speedMhz,
        formFactor:     p.motherboardSpec?.formFactor ?? p.caseSpec?.formFactor,
        gpuLengthMm:    p.gpuSpec?.lengthMm,
        maxGpuLengthMm: p.caseSpec?.maxGpuLengthMm,
        socketSupport:  p.coolerSpec?.socketSupport,
        ramSlots:       p.motherboardSpec?.ramSlots,
        maxRamGb:       p.motherboardSpec?.maxRamGb,
        capacityGb:     p.storageSpec?.capacityGb,
        interfaceType:  p.storageSpec?.interfaceType,
      }));
      setParts(slot, mapped);
    } catch (e) {
      setParts(slot, []);
      toast.error(e instanceof Error ? e.message : "Failed to load parts — please refresh");
    } finally {
      setLoading(slot, false);
    }
  }, [parts, catMap, setParts, setLoading]);

  const openPicker = useCallback(async (slot: string) => {
    await loadParts(slot);
    storeOpenPicker(slot);
  }, [loadParts, storeOpenPicker]);

  return { parts, loading, pickerSlot, openPicker, closePicker };
}
