"use client";

import { Heart } from "lucide-react";

import { LoginOverlay } from "@/features/auth";
import { useWishlistButton } from "./hooks/useWishlistButton";

const BTN_BASE = "flex h-12 w-12 items-center justify-center border transition-all";

export function WishlistButton({ productId }: { productId: string }) {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { user, saved, loading, toggle } = useWishlistButton(productId);

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
