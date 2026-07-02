export type ApiPart = {
  id: string;
  name: string;
  brand: string;
  displayPrice: number;
  thumbnailUrl: string | null;
  // Power
  tdp?: number | null;
  wattage?: number | null;
  // Socket — CPU & Motherboard (e.g. AM5, LGA1700, LGA1851)
  socket?: string | null;
  // RAM — Motherboard ramGen + RAM generation (DDR4 / DDR5)
  ramGen?: string | null;
  ramSpeedMhz?: number | null;
  // Form factor — Motherboard & Case (ATX, mATX, mini-ITX)
  formFactor?: string | null;
  // GPU physical length vs case max
  gpuLengthMm?: number | null;
  maxGpuLengthMm?: number | null;
  // Cooler socket compatibility (comma-separated: "AM5,AM4,LGA1700,LGA1851")
  socketSupport?: string | null;
  // Motherboard RAM capacity
  ramSlots?: number | null;
  maxRamGb?: number | null;
};

export type CompatibilityResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  requiredWatts?: number;
};

export type SortKey = "price-asc" | "price-desc" | "name-asc";

export type SlotCfg = {
  slot: string;
  label: string;
  shortLabel: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  defaultWatts: number;
  specs: { key: keyof ApiPart; label: string; fmt?: (v: unknown) => string }[];
};
