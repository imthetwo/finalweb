import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
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

  const loadGuestItems = useCallback(async () => {
    const raw = getGuestCart();
    if (raw.length === 0) {
      setGuestItems([]);
      return;
    }
    const result = await Promise.all(
      raw.map(async (item) => {
        let product = productCacheRef.current.get(item.productId);
        if (!product) {
          product = await apiFetch<ProductListItem>(`/products/${item.productId}`);
          productCacheRef.current.set(item.productId, product);
        }
        return { ...item, product };
      })
    ).catch((e) => {
      toast.error(e instanceof Error ? e.message : "Failed to load cart items");
      return [] as GuestDisplayItem[];
    });
    setGuestItems(result);
  }, []);

  // Initial data load
  useEffect(() => {
    if (!loaded) return;
    if (isLoggedIn) {
      apiFetch<Cart>("/cart")
        .then(setCart)
        .catch(() => setCart({ items: [], subTotal: 0 }));
      return;
    }
    const raw = getGuestCart();
    if (raw.length === 0) {
      apiFetch<{ items: ProductListItem[] }>("/products?limit=4")
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
        apiFetch<Cart>("/cart").then(setCart).catch(() => toast.error("Failed to refresh cart"));
      } else {
        await loadGuestItems();
        if (getGuestCart().length === 0) {
          apiFetch<{ items: ProductListItem[] }>("/products?limit=4")
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
    setUpdatingId(itemId);
    try {
      setCart(
        await apiFetch<Cart>(`/cart/items/${itemId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity }),
        }),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setUpdatingId(null);
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
