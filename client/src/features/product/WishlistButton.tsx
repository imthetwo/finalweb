"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { addToWishlist, removeFromWishlist, fetchWishlist } from "@/lib/api";
import { LoginOverlay } from "@/features/auth/LoginOverlay";

const BTN_BASE = "flex h-12 w-12 items-center justify-center border transition-all";

export default function WishlistButton({ productId }: { productId: string }) {
  const [authed, setAuthed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) return;
    setAuthed(true);
    fetchWishlist()
      .then((items) => setSaved(items.some((w) => w.product.id === productId)))
      .catch(() => {});
  }, [productId]);

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

  // Not signed in → open login dialog instead of an error toast
  if (!authed) {
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
          ? "border-red-500/50 bg-red-950/30 text-red-400"
          : "border-edge text-secondary hover:border-brand/40 hover:text-brand"
      } disabled:opacity-50`}
    >
      <Heart size={18} className={saved ? "fill-red-400" : ""} />
    </button>
  );
}
