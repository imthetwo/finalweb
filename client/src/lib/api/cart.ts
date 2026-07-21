import { apiFetch, fetchWithTimeout, getApiUrl } from "./client";
import type { GuestCartItem } from "@/lib/guestCart";
import type { Cart } from "@/features/cart/types";

export type MergeCartResult = { merged: number; skipped: number };

export const fetchCart = () => apiFetch<Cart>("/cart");

export const addCartItem = (productId: string, quantity = 1) =>
  apiFetch<Cart>("/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity }) });

export const updateCartItemQty = (itemId: string, quantity: number) =>
  apiFetch<Cart>(`/cart/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ quantity }) });

// Merges a guest (localStorage) cart into the just-authenticated account's
// server cart. Lossless: quantities for products already in the account cart
// are combined (server clamps to stock/category caps) rather than rejected —
// unlike the one-shot POST /cart/items used by the "Add to Cart" button.
export async function mergeGuestCart(
  items: GuestCartItem[],
  token: string,
): Promise<MergeCartResult> {
  const res = await fetchWithTimeout(getApiUrl("/cart/merge"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error("Failed to merge guest cart");
  return res.json() as Promise<MergeCartResult>;
}
