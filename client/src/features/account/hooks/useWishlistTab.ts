import { useEffect, useState } from "react";
import { toast } from "sonner";

import { fetchWishlist, removeFromWishlist, type WishlistEntry } from "@/lib/api";

// Data/logic for the account Wishlist tab — loading entries and removing one.
export function useWishlistTab() {
  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  async function remove(productId: string) {
    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove");
    } finally {
      setRemovingId(null);
    }
  }

  return { items, loading, removingId, remove };
}
