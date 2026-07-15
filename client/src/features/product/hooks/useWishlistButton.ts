import { useEffect, useState } from "react";
import { toast } from "sonner";

import { addToWishlist, removeFromWishlist, fetchWishlist } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

// Logic for the wishlist toggle button — tracks whether the product is saved for
// the current user and toggles it. The component only renders the heart states.
export function useWishlistButton(productId: string) {
  const user = useAuthStore((s) => s.user);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchWishlist()
      .then((items) => setSaved(items.some((w) => w.product.id === productId)))
      .catch(() => {});
  }, [user, productId]);

  async function toggle() {
    setLoading(true);
    try {
      if (saved) {
        await removeFromWishlist(productId);
        setSaved(false);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(productId);
        setSaved(true);
        toast.success("Added to wishlist");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return { user, saved, loading, toggle };
}
