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

// Display-only: renders the admin-unit prefix in English ("Thành phố X" →
// "X City", "Tỉnh Y" → "Y Province") for an English-language UI. The
// underlying value stays the official Vietnamese name — that's what's
// submitted and stored, since couriers and wardsOf() key off it.
export const displayCityName = (name: string): string => {
  if (name.startsWith("Thành phố ")) return `${name.slice("Thành phố ".length)} City`;
  if (name.startsWith("Tỉnh ")) return `${name.slice("Tỉnh ".length)} Province`;
  return name;
};

// Same idea as displayCityName(), for the ward/commune level: "Phường X" →
// "X Ward", "Xã X" → "X Commune", "Đặc khu X" → "X Special Zone" (island
// districts like Vân Đồn, Cô Tô) for display. The submitted/stored value
// stays the official Vietnamese name. "xã " (lowercase) is matched too — a
// handful of entries in the source data are inconsistently cased.
export const displayWardName = (name: string): string => {
  if (name.startsWith("Phường ")) return `${name.slice("Phường ".length)} Ward`;
  if (name.startsWith("Xã ") || name.startsWith("xã ")) return `${name.slice(3)} Commune`;
  if (name.startsWith("Đặc khu ")) return `${name.slice("Đặc khu ".length)} Special Zone`;
  return name;
};
