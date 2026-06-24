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
  CPU:          "Processors (CPU)",
  CPU_COOLER:   "CPU Coolers",
  MOTHERBOARD:  "Motherboards",
  MEMORY:       "RAM",
  STORAGE:      "Storage (SSD/HDD)",
  GPU:          "Graphics Cards (GPU)",
  CASE:         "PC Cases",
  POWER_SUPPLY: "Power Supplies",
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
      .catch(() => {});
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
          cpuSpec?: { tdp?: number; socket?: string } | null;
          gpuSpec?: { tdp?: number } | null;
          motherboardSpec?: { socket?: string; ramGen?: string; formFactor?: string } | null;
          ramSpec?: { generation?: string } | null;
          psuSpec?: { wattage?: number } | null;
          caseSpec?: { formFactor?: string } | null;
          coolerSpec?: { coolerType?: string; tdpRating?: number } | null;
          storageSpec?: { interfaceType?: string } | null;
        }>;
      }>(`/products?categoryId=${encodeURIComponent(categoryId)}&limit=50`);

      const mapped: ApiPart[] = data.items.map((p) => ({
        id: p.id, name: p.name, brand: p.brand,
        displayPrice: p.displayPrice, thumbnailUrl: p.thumbnailUrl,
        tdp:        p.cpuSpec?.tdp ?? p.gpuSpec?.tdp ?? p.coolerSpec?.tdpRating,
        wattage:    p.psuSpec?.wattage,
        socket:     p.cpuSpec?.socket ?? p.motherboardSpec?.socket,
        ramGen:     p.motherboardSpec?.ramGen ?? p.ramSpec?.generation,
        formFactor: p.motherboardSpec?.formFactor ?? p.caseSpec?.formFactor
                      ?? p.storageSpec?.interfaceType ?? p.coolerSpec?.coolerType,
      }));
      setParts(slot, mapped);
    } catch {
      setParts(slot, []);
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
    const cpu = selected["CPU"];
    const mb  = selected["MOTHERBOARD"];
    const ram = selected["MEMORY"];
    const psu = selected["POWER_SUPPLY"];

    if (cpu && mb && cpu.socket && mb.socket && cpu.socket !== mb.socket)
      errors.push(`CPU socket (${cpu.socket}) không khớp Motherboard (${mb.socket})`);
    if (mb && ram && mb.ramGen && ram.ramGen && mb.ramGen !== ram.ramGen)
      errors.push(`RAM (${ram.ramGen}) không khớp Motherboard (${mb.ramGen})`);

    const totalWatts = BUILD_SLOTS.reduce((s, cfg) => {
      const p = selected[cfg.slot];
      return s + (p ? (p.tdp ?? cfg.defaultWatts) : 0);
    }, 0);
    if (psu?.wattage && totalWatts > psu.wattage * 0.8)
      warnings.push(`TDP ~${totalWatts}W gần giới hạn PSU ${psu.wattage}W (nên <80%)`);

    setCompat({ valid: errors.length === 0, errors, warnings });
    if (errors.length === 0) toast.success(warnings.length ? "Build OK (có cảnh báo)" : "Build hoàn toàn tương thích!");
    else toast.error(`${errors.length} lỗi không tương thích`);
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
