// Per-order quantity caps by category.
// Expensive / core build parts (one PC needs at most 1–2 of each): max 2.
// Cheap accessories & furniture (mice, headsets, chairs, desks…): max 5.
const MAX_TWO_CATEGORIES = new Set([
  'Processors (CPU)',
  'Graphics Cards (GPU)',
  'Motherboards',
  'RAM',
  'PC Cases',
  'Laptops',
  'Prebuilt PCs',
]);

const DEFAULT_QTY_CAP = 5;

export function maxQtyFor(categoryName?: string | null): number {
  return categoryName && MAX_TWO_CATEGORIES.has(categoryName) ? 2 : DEFAULT_QTY_CAP;
}
