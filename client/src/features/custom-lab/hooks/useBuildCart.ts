"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { addCartItem } from "@/lib/api/cart";
import { getToken } from "@/lib/auth";
import { addToGuestCart, getGuestCart } from "@/lib/guestCart";
import { useBuilderStore } from "@/store/builderStore";
import type { ApiPart } from "../types";

// Custom hook #3 — turns the current build into cart actions: add every selected
// part to the cart, or (placeholder) save the build.
export function useBuildCart() {
  const router     = useRouter();
  const selected   = useBuilderStore((s) => s.selected);
  const addingCart = useBuilderStore((s) => s.addingCart);

  const { setAddingCart } = useBuilderStore.getState();

  const addAllToCart = useCallback(async () => {
    const items = Object.values(selected).filter(Boolean) as ApiPart[];
    if (!items.length) { toast.error("No parts selected."); return; }

    setAddingCart(true);
    try {
      let added = 0;
      let alreadyInCart = 0;

      if (getToken()) {
        // Add-to-cart is one-shot site-wide (server rejects a product already
        // in the cart — quantity only changes from the cart page). Use
        // allSettled so one "already in cart" rejection doesn't sink the
        // whole batch and mislabel parts that really did get added.
        const results = await Promise.allSettled(items.map((p) => addCartItem(p.id)));
        for (const r of results) {
          if (r.status === "fulfilled") added++; else alreadyInCart++;
        }
      } else {
        // Same one-shot rule for the guest cart — re-adding an already-present
        // part must not keep bumping its quantity past the intended cap.
        const guestCart = getGuestCart();
        for (const p of items) {
          if (guestCart.some((i) => i.productId === p.id)) { alreadyInCart++; continue; }
          addToGuestCart(p.id, 1);
          added++;
        }
      }

      const viewCartAction = { action: { label: "View cart", onClick: () => router.push("/cart") } };
      if (added > 0) {
        toast.success(
          alreadyInCart > 0
            ? `Added ${added} new part(s) — ${alreadyInCart} were already in your cart.`
            : `Added ${added} part(s) to your cart.`,
          viewCartAction,
        );
        window.dispatchEvent(new Event("cart-updated"));
      } else {
        toast.info("All selected parts are already in your cart.", viewCartAction);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add to cart.");
    } finally {
      setAddingCart(false);
    }
  }, [selected, setAddingCart, router]);

  const saveBuild = useCallback(async () => {
    toast.info("Saving builds is coming soon.");
  }, []);

  return { addingCart, addAllToCart, saveBuild };
}
