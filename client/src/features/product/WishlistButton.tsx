"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { addToWishlist, removeFromWishlist, fetchWishlist } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { LoginOverlay } from "@/features/auth/LoginOverlay";

const BTN_BASE = "flex h-12 w-12 items-center justify-center border transition-all";

export function WishlistButton({ productId }: { productId: string }) {
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

  if (!user) {
    return (
      <LoginOverlay
        triggerButton={
          <button
            type="button"
            aria-label="Add to wishlist"
            className={`${BTN_BASE} border-edge text-secondary hover:border-brand/40 hover:text-brand`}
          >
            <Heart size={18} />
          </button>
        }
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className={`${BTN_BASE} ${
        saved
          ? "border-destructive/50 bg-destructive/10 text-destructive"
          : "border-edge text-secondary hover:border-brand/40 hover:text-brand"
      } disabled:opacity-50`}
    >
      <Heart size={18} className={saved ? "fill-destructive" : ""} />
    </button>
  );
}
