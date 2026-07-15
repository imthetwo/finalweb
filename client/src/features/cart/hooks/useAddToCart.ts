import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import { addToGuestCart, getGuestCart } from "@/lib/guestCart";
import { useAuthStore } from "@/store/authStore";

// Logic for the "Add to cart" action — server cart when logged in, localStorage
// guest cart otherwise, plus the transient "added" confirmation state.
// Add-to-cart is one-shot: if the product is already in the cart we show an
// informative toast instead of increasing the quantity (quantity is adjusted
// from the cart page only).
export function useAddToCart(productId: string) {
  const router = useRouter();
  const authed = useAuthStore((s) => !!s.user);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const alreadyInCartToast = () =>
    toast.info("This product is already in your cart", {
      description: "You can adjust the quantity from your cart.",
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });

  async function add() {
    // Guest cart lives locally — we can check for duplicates without a request
    if (!authed && getGuestCart().some((i) => i.productId === productId)) {
      alreadyInCartToast();
      return;
    }

    setLoading(true);
    try {
      if (authed) {
        await apiFetch("/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId, quantity: 1 }),
        });
      } else {
        addToGuestCart(productId);
      }
      toast.success("Added to cart", {
        action: { label: "View cart", onClick: () => router.push("/cart") },
      });
      window.dispatchEvent(new Event("cart-updated"));
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add to cart";
      // The server rejects re-adding an existing product — inform, don't alarm
      if (msg.includes("already in your cart")) alreadyInCartToast();
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return { loading, done, add };
}
