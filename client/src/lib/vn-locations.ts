import locations from "./data/vn-locations.json";

// Vietnam's official two-tier administrative structure (effective 1 July 2025):
// 34 provinces/cities → 3,321 wards/communes (districts were abolished).
// Bundled locally so any feature needing addresses (checkout, account address
// book) never depends on an external API.
export type VnLocation = { name: string; wards: string[] };

export const VN_LOCATIONS: VnLocation[] = locations;

export const wardsOf = (city: string): string[] =>
  [...(VN_LOCATIONS.find((l) => l.name === city)?.wards ?? [])].sort((a, b) =>
    a.localeCompare(b, "vi"),
  );
