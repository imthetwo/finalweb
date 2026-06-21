"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ProductListItem } from "@/types/api";

type CartItem = {
  id: string;
  quantity: number;
  product: ProductListItem & { salePrice: number | null };
  lineTotal: number;
};

type Cart = { id: string; items: CartItem[]; subTotal: number };

export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;
    try {
      const data = await apiFetch<Cart>("/cart");
      setCart(data);
    } catch {
      setCart(null);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addItem = async (productId: string, quantity = 1) => {
    setLoading(true);
    try {
      const data = await apiFetch<Cart>("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });
      setCart(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    setLoading(true);
    try {
      const data = await apiFetch<Cart>(`/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<Cart>(`/cart/items/${itemId}`, { method: "DELETE" });
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const clear = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Cart>("/cart", { method: "DELETE" });
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  return {
    cart,
    loading,
    itemCount: cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0,
    subTotal: cart?.subTotal ?? 0,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    refresh: load,
  };
}
