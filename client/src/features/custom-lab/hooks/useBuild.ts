"use client";

import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { fetchCategories } from "@/lib/api/products";
import { getToken } from "@/lib/auth";
import { useBuilderStore, selectTotalPrice, selectSelectedCount } from "@/store/builderStore";
import type { ApiPart } from "../types";
import { BUILD_SLOTS } from "../constants";

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

export function useBuild() {
  // ── State từ Zustand ────────────────────────────────────────────
  const selected    = useBuilderStore((s) => s.selected);
  const parts       = useBuilderStore((s) => s.parts);
  const loading     = useBuilderStore((s) => s.loading);
  const catMap      = useBuilderStore((s) => s.catMap);
  const pickerSlot  = useBuilderStore((s) => s.pickerSlot);
  const compat      = useBuilderStore((s) => s.compat);
  const validating  = useBuilderStore((s) => s.validating);
  const addingCart  = useBuilderStore((s) => s.addingCart);

  // ── Actions từ store ────────────────────────────────────────────
  const {
    setCatMap, setParts, setLoading,
    openPicker: storeOpenPicker, closePicker,
    selectPart, removePart,
    setCompat, setValidating, setAddingCart,
  } = useBuilderStore.getState();

  // ── Selectors: tính toán từ state ───────────────────────────────
  const totalPrice    = useBuilderStore(selectTotalPrice);
  const selectedCount = useBuilderStore(selectSelectedCount);

  const estimatedWatts = useMemo(
    () => BUILD_SLOTS.reduce((sum, cfg) => {
      const p = selected[cfg.slot];
      return sum + (p ? (p.tdp ?? p.wattage ?? cfg.defaultWatts) : 0);
    }, 0),
    [selected],
  );

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
        }>;
      }>(`/products?categoryId=${encodeURIComponent(categoryId)}&limit=50`);

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

  // ── Validate compatibility ───────────────────────────────────────
  const validateBuild = useCallback(async () => {
    const items = Object.entries(selected).filter(([, p]) => p);
    if (items.length < 2) { toast.message("Select at least 2 parts to validate."); return; }
    setValidating(true);

    const errors: string[] = [];
    const warnings: string[] = [];

    const cpu    = selected["CPU"];
    const mb     = selected["MOTHERBOARD"];
    const ram    = selected["MEMORY"];
    const psu    = selected["POWER_SUPPLY"];
    const gpu    = selected["GPU"];
    const pcCase = selected["CASE"];
    const cooler = selected["CPU_COOLER"];

    // ── Rule 1: CPU socket ↔ Motherboard socket ──────────────────
    if (cpu && mb && cpu.socket && mb.socket && cpu.socket !== mb.socket)
      errors.push(`CPU socket ${cpu.socket} does not fit Motherboard socket ${mb.socket}`);

    // ── Rule 2: RAM generation ↔ Motherboard RAM gen ─────────────
    if (mb && ram && mb.ramGen && ram.ramGen && mb.ramGen !== ram.ramGen)
      errors.push(`RAM is ${ram.ramGen} but Motherboard only supports ${mb.ramGen}`);

    // ── Rule 3: GPU physical length ↔ Case max GPU length ────────
    if (gpu && pcCase && gpu.gpuLengthMm && pcCase.maxGpuLengthMm) {
      if (gpu.gpuLengthMm > pcCase.maxGpuLengthMm)
        errors.push(`GPU is ${gpu.gpuLengthMm}mm long — Case only fits up to ${pcCase.maxGpuLengthMm}mm`);
    }

    // ── Rule 4: Motherboard form factor ↔ Case form factor ───────
    if (mb && pcCase && mb.formFactor && pcCase.formFactor) {
      const FF: Record<string, number> = { 'mini-itx': 0, 'miniitx': 0, 'matx': 1, 'microatx': 1, 'atx': 2, 'eatx': 3, 'e-atx': 3 };
      const norm = (s: string) => s.toLowerCase().replace(/[-\s]/g, '');
      const mbIdx   = FF[norm(mb.formFactor)] ?? -1;
      const caseIdx = FF[norm(pcCase.formFactor)] ?? -1;
      if (mbIdx !== -1 && caseIdx !== -1 && mbIdx > caseIdx)
        errors.push(`Motherboard (${mb.formFactor}) is too large for Case (${pcCase.formFactor})`);
    }

    // ── Rule 5: CPU Cooler socket support ↔ CPU socket ───────────
    if (cpu && cooler && cpu.socket && cooler.socketSupport) {
      const supported = cooler.socketSupport.split(',').map((s) => s.trim());
      if (!supported.includes(cpu.socket))
        errors.push(`Cooler does not support ${cpu.socket} (supports: ${cooler.socketSupport})`);
    }

    // ── Rule 6: PSU wattage vs total system TDP ──────────────────
    const totalWatts = BUILD_SLOTS.reduce((s, cfg) => {
      const p = selected[cfg.slot];
      return s + (p ? (p.tdp ?? cfg.defaultWatts) : 0);
    }, 0);
    if (psu?.wattage) {
      if (totalWatts > psu.wattage)
        errors.push(`System needs ~${totalWatts}W but PSU is only ${psu.wattage}W — not enough power`);
      else if (totalWatts > psu.wattage * 0.8)
        warnings.push(`System uses ~${totalWatts}W which is over 80% of PSU capacity (${psu.wattage}W) — consider a larger PSU`);
    }

    setCompat({ valid: errors.length === 0, errors, warnings, requiredWatts: totalWatts });
    if (errors.length === 0) toast.success(warnings.length ? "Build compatible (with warnings)" : "Build fully compatible!");
    else toast.error(`${errors.length} compatibility issue${errors.length > 1 ? "s" : ""} found`);
    setValidating(false);
  }, [selected, setCompat, setValidating]);

  // ── Add all to cart ─────────────────────────────────────────────
  const addAllToCart = useCallback(async () => {
    const items = Object.values(selected).filter(Boolean) as ApiPart[];
    if (!items.length) { toast.error("Chưa chọn linh kiện nào."); return; }
    if (!getToken()) { toast.error("Vui lòng đăng nhập."); return; }
    setAddingCart(true);
    try {
      await Promise.all(items.map((p) =>
        apiFetch("/cart/items", { method: "POST", body: JSON.stringify({ productId: p.id, quantity: 1 }) })
      ));
      toast.success(`Đã thêm ${items.length} linh kiện vào giỏ hàng.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể thêm vào giỏ.");
    } finally {
      setAddingCart(false);
    }
  }, [selected, setAddingCart]);

  const saveBuild = useCallback(async () => {
    toast.info("Tính năng lưu build đang phát triển.");
  }, []);

  return {
    // State (từ store — mọi component đều subscribe được)
    selected, parts, loading, pickerSlot, compat,
    validating, saving: false, addingCart,
    // Derived
    totalPrice, estimatedWatts, selectedCount,
    // Actions
    openPicker, closePicker, selectPart, removePart,
    validateBuild, addAllToCart, saveBuild,
  };
}
