"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { fetchCategories } from "@/lib/api/products";
import type { ApiPart, CompatibilityResult } from "../types";
import { BUILD_SLOTS } from "../constants";

// Map slot key → tên category trong DB
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
  const [selected,   setSelected]   = useState<Record<string, ApiPart | null>>({});
  const [parts,      setParts]      = useState<Record<string, ApiPart[]>>({});
  const [loading,    setLoading]    = useState<Record<string, boolean>>({});
  const [pickerSlot, setPickerSlot] = useState<string | null>(null);
  const [compat,     setCompat]     = useState<CompatibilityResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [saving]                    = useState(false);
  const [addingCart, setAddingCart] = useState(false);

  // categoryId map — tải 1 lần khi mount
  const [catMap, setCatMap] = useState<Record<string, string>>({});
  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        const map: Record<string, string> = {};
        for (const cat of cats) map[cat.name] = cat.id;
        setCatMap(map);
      })
      .catch(() => {});
  }, []);

  // Kéo sản phẩm từ DB theo categoryId tương ứng với slot
  const loadParts = useCallback(async (slot: string) => {
    if (parts[slot]) return;
    setLoading((p) => ({ ...p, [slot]: true }));
    try {
      const categoryName = SLOT_TO_CATEGORY[slot];
      const categoryId   = catMap[categoryName];

      if (!categoryId) {
        // Category chưa có trong DB — trả về danh sách rỗng
        setParts((p) => ({ ...p, [slot]: [] }));
        return;
      }

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

      // Flatten spec fields vào top-level để PartPickerOverlay dùng được
      const mapped: ApiPart[] = data.items.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        displayPrice: p.displayPrice,
        thumbnailUrl: p.thumbnailUrl,
        tdp: p.cpuSpec?.tdp ?? p.gpuSpec?.tdp ?? p.coolerSpec?.tdpRating ?? undefined,
        wattage: p.psuSpec?.wattage ?? undefined,
        socket: p.cpuSpec?.socket ?? p.motherboardSpec?.socket ?? undefined,
        ramGen: p.motherboardSpec?.ramGen ?? p.ramSpec?.generation ?? undefined,
        formFactor: p.motherboardSpec?.formFactor ?? p.caseSpec?.formFactor ?? p.storageSpec?.interfaceType ?? p.coolerSpec?.coolerType ?? undefined,
      }));

      setParts((p) => ({ ...p, [slot]: mapped }));
    } catch {
      setParts((p) => ({ ...p, [slot]: [] }));
    } finally {
      setLoading((p) => ({ ...p, [slot]: false }));
    }
  }, [parts, catMap]);

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
    // Client-side compatibility check (không cần backend)
    const errors: string[] = [];
    const warnings: string[] = [];
    const cpu = selected["CPU"];
    const mb  = selected["MOTHERBOARD"];
    const ram = selected["MEMORY"];
    const psu = selected["POWER_SUPPLY"];

    if (cpu && mb && cpu.socket && mb.socket && cpu.socket !== mb.socket) {
      errors.push(`CPU socket (${cpu.socket}) không khớp với Motherboard (${mb.socket})`);
    }
    if (mb && ram && mb.ramGen && ram.ramGen && mb.ramGen !== ram.ramGen) {
      errors.push(`RAM type (${ram.ramGen}) không khớp với Motherboard (${mb.ramGen})`);
    }
    const totalWatts = BUILD_SLOTS.reduce((s, cfg) => {
      const p = selected[cfg.slot];
      return s + (p ? (p.tdp ?? cfg.defaultWatts) : 0);
    }, 0);
    if (psu?.wattage && totalWatts > psu.wattage * 0.8) {
      warnings.push(`Tổng TDP ~${totalWatts}W gần giới hạn PSU ${psu.wattage}W (khuyến nghị <80%)`);
    }

    setCompat({ valid: errors.length === 0, errors, warnings });
    if (errors.length === 0) toast.success(warnings.length ? "Build OK (có cảnh báo)" : "Build hoàn toàn tương thích!");
    else toast.error(`${errors.length} lỗi không tương thích`);
    setValidating(false);
  }, [selected]);

  const addAllToCart = useCallback(async () => {
    const items = Object.entries(selected).filter(([, p]) => p).map(([, p]) => p!);
    if (!items.length) { toast.error("Chưa chọn linh kiện nào."); return; }
    if (!localStorage.getItem("access_token")) { toast.error("Vui lòng đăng nhập."); return; }
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
  }, [selected]);

  const saveBuild = useCallback(async () => {
    toast.info("Tính năng lưu build đang phát triển.");
  }, []);

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
