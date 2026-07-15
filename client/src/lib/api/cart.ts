import { getApiUrl } from "./client";
import type { GuestCartItem } from "@/lib/guestCart";

export type MergeCartResult = { merged: number; skipped: number };

// Merges a guest (localStorage) cart into the just-authenticated account's
// server cart. Lossless: quantities for products already in the account cart
// are combined (server clamps to stock/category caps) rather than rejected —
// unlike the one-shot POST /cart/items used by the "Add to Cart" button.
export async function mergeGuestCart(
  items: GuestCartItem[],
  token: string,
): Promise<MergeCartResult> {
  const res = await fetch(getApiUrl("/cart/merge"), {
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
