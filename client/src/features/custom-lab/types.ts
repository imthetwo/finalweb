export type ApiPart = {
  id: string;
  name: string;
  brand: string;
  displayPrice: number;
  thumbnailUrl: string | null;
  tdp?: number | null;
  wattage?: number | null;
  socket?: string | null;
  ramGen?: string | null;
  formFactor?: string | null;
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
