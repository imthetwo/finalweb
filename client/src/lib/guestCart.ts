export type GuestCartItem = { productId: string; quantity: number };

const KEY = "guest_cart";

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function addToGuestCart(productId: string, quantity = 1): void {
  const cart = getGuestCart();
  const existing = cart.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, 999);
  } else {
    cart.push({ productId, quantity });
  }
  localStorage.setItem(KEY, JSON.stringify(cart));
}

export function updateGuestCartQty(productId: string, quantity: number): void {
  const cart = getGuestCart();
  if (quantity <= 0) {
    const idx = cart.findIndex((i) => i.productId === productId);
    if (idx !== -1) cart.splice(idx, 1);
  } else {
    const item = cart.find((i) => i.productId === productId);
    if (item) item.quantity = Math.min(quantity, 999);
  }
  localStorage.setItem(KEY, JSON.stringify(cart));
}

export function clearGuestCart(): void {
  localStorage.removeItem(KEY);
}

// Count of distinct products (consistent with server cart badge)
export function getGuestCartCount(): number {
  return getGuestCart().length;
}
