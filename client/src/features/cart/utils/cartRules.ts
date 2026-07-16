// Shipping — mirrors the backend (orders.service): flat fee, free over the threshold.
const SHIPPING_FEE = 30000;
const FREE_SHIPPING_OVER = 2000000;
export const shippingFor = (subTotal: number) => (subTotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE);

// Per-order quantity cap by category — mirrors the backend rule
// (server/src/common/quantity-caps.ts): expensive/core build parts max 2,
// cheap accessories & furniture max 5.
const MAX_TWO_CATEGORIES = new Set([
  "Processors (CPU)",
  "Graphics Cards (GPU)",
  "Motherboards",
  "RAM",
  "PC Cases",
  "Laptops",
  "Prebuilt PCs",
]);

export function getMaxQty(categoryName: string | undefined | null, stock: number): number {
  const cap = categoryName && MAX_TWO_CATEGORIES.has(categoryName) ? 2 : 5;
  return Math.min(cap, stock);
}
