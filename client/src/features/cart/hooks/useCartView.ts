import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { fetchCart, updateCartItemQty } from "@/lib/api/cart";
import { fetchProductById, fetchProducts } from "@/lib/api/products";
import { getGuestCart, updateGuestCartQty } from "@/lib/guestCart";
import { useAuthState } from "@/hooks/useAuthState";
import type { ProductListItem } from "@/types/api";
import type { Cart, CartItem, GuestDisplayItem } from "../types";

type CartViewState =
  | { status: "loading" }
  | {
      status: "authed";
      cart: Cart;
      standalone: CartItem[];
      buildGroups: [string, CartItem[]][];
      isEmpty: boolean;
      updatingId: string | null;
      updateQty: (itemId: string, quantity: number) => void;
    }
  | {
      status: "guest";
      guestItems: GuestDisplayItem[];
      guestTotal: number;
      guestEmpty: boolean;
      trending: ProductListItem[];
      updateGuestQty: (productId: string, quantity: number) => void;
    };

// Groups cart items by customBuildId — items without one are "standalone".
function groupByBuild(items: CartItem[]): { standalone: CartItem[]; buildGroups: [string, CartItem[]][] } {
  const standalone = items.filter((i) => !i.customBuildId);
  const buildMap = new Map<string, CartItem[]>();
  for (const item of items) {
    if (!item.customBuildId) continue;
    buildMap.set(item.customBuildId, [...(buildMap.get(item.customBuildId) ?? []), item]);
  }
  return { standalone, buildGroups: [...buildMap.entries()] };
}

export function useCartView(): CartViewState {
  const { user, loaded } = useAuthState();
  const isLoggedIn = loaded && !!user;

  const [cart, setCart] = useState<Cart | null>(null);
  const [guestItems, setGuestItems] = useState<GuestDisplayItem[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trending, setTrending] = useState<ProductListItem[]>([]);

  // Cache product details so we don't re-fetch on every cart-updated event
  const productCacheRef = useRef(new Map<string, ProductListItem>());
  // Sequences updateQty calls so an older, slower response can't overwrite
  // the cart with stale data after a newer request has already resolved.
  const updateSeqRef = useRef(0);

  const loadGuestItems = useCallback(async () => {
    const raw = getGuestCart();
    if (raw.length === 0) {
      setGuestItems([]);
      return;
    }
    // Each item is fetched independently so one missing/deleted product can't
    // fail the whole cart — it's just pruned from localStorage instead.
    const settled = await Promise.allSettled(
      raw.map(async (item) => {
        let product = productCacheRef.current.get(item.productId);
        if (!product) {
          product = await fetchProductById(item.productId);
          productCacheRef.current.set(item.productId, product);
        }
        return { ...item, product };
      })
    );

    const result: GuestDisplayItem[] = [];
    let removed = 0;
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") {
        result.push(r.value);
      } else {
        updateGuestCartQty(raw[i].productId, 0); // prune from localStorage
        removed++;
      }
    });

    if (removed > 0) {
      toast.message(
        removed === 1
          ? "A product in your cart is no longer available and was removed."
          : `${removed} products in your cart are no longer available and were removed.`,
      );
      window.dispatchEvent(new Event("cart-updated")); // refresh header badge
    }

    setGuestItems(result);
  }, []);

  // Initial data load
  useEffect(() => {
    if (!loaded) return;
    if (isLoggedIn) {
      fetchCart()
        .then(setCart)
        .catch(() => setCart({ items: [], subTotal: 0 }));
      return;
    }
    const raw = getGuestCart();
    if (raw.length === 0) {
      fetchProducts({ limit: 4 })
        .then((d) => setTrending(d.items))
        .catch(() => {});
    } else {
      setGuestLoading(true);
      loadGuestItems().finally(() => setGuestLoading(false));
    }
  }, [loaded, isLoggedIn, loadGuestItems]);

  // Listen for cart-updated events
  useEffect(() => {
    if (!loaded) return;
    const handler = async () => {
      if (isLoggedIn) {
        fetchCart().then(setCart).catch(() => toast.error("Failed to refresh cart"));
      } else {
        await loadGuestItems();
        if (getGuestCart().length === 0) {
          fetchProducts({ limit: 4 })
            .then((d) => setTrending(d.items))
            .catch(() => {});
        }
      }
    };
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, [loaded, isLoggedIn, loadGuestItems]);

  function updateGuestQty(productId: string, quantity: number) {
    updateGuestCartQty(productId, quantity);
    if (quantity <= 0) {
      setGuestItems((prev) => prev.filter((i) => i.productId !== productId));
      window.dispatchEvent(new Event("cart-updated")); // update header badge
    } else {
      setGuestItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      );
    }
  }

  async function updateQty(itemId: string, quantity: number) {
    const seq = ++updateSeqRef.current;
    setUpdatingId(itemId);
    try {
      const updated = await updateCartItemQty(itemId, quantity);
      // Drop this response if a newer updateQty call has since been issued —
      // otherwise an older request that happens to resolve later ("last
      // response wins") could overwrite the cart with data that's already
      // out of date, undoing whatever the user did in the meantime.
      if (seq === updateSeqRef.current) setCart(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      if (seq === updateSeqRef.current) setUpdatingId(null);
    }
  }

  const grouped = useMemo(() => (cart ? groupByBuild(cart.items) : null), [cart]);
  const guestTotal = useMemo(
    () => guestItems.reduce((s, i) => s + i.product.displayPrice * i.quantity, 0),
    [guestItems],
  );

  if (!loaded || (isLoggedIn && cart === null) || (!isLoggedIn && guestLoading)) {
    return { status: "loading" };
  }

  if (isLoggedIn && cart && grouped) {
    return {
      status: "authed",
      cart,
      standalone: grouped.standalone,
      buildGroups: grouped.buildGroups,
      isEmpty: cart.items.length === 0,
      updatingId,
      updateQty,
    };
  }

  return {
    status: "guest",
    guestItems,
    guestTotal,
    guestEmpty: guestItems.length === 0,
    trending,
    updateGuestQty,
  };
}
