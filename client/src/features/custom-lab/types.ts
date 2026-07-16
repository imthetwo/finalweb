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
  // Storage
  capacityGb?: number | null;
  interfaceType?: string | null;
};

// Raw shape returned by GET /products for the part-picker catalog — narrower
// than the full spec objects, just the fields usePartCatalog maps into ApiPart.
export type PartCatalogItem = {
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
};

export type CompatibilityResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  requiredWatts?: number;
};

// Result of checking a single candidate part against the current build, for
// the part-picker's Compatibility Filter and its "Add" confirmation toast —
// distinct from CompatibilityResult, which validates the whole build at once.
export type CompatCheck = { ok: boolean; label: string; detail: string };

export type SortKey = "price-asc" | "price-desc" | "name-asc";

export type SlotCfg = {
  slot: string;
  label: string;
  shortLabel: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  defaultWatts: number;
  specs: { key: keyof ApiPart; label: string; fmt?: (v: unknown) => string }[];
};
