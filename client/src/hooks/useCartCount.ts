"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { getGuestCartCount } from "@/lib/guestCart";

type CartResponse = { items: unknown[] };

export function useCartCount() {
  const [count, setCount] = useState(0);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const refresh = () => {
      if (user) {
        apiFetch<CartResponse>("/cart")
          .then((data) => setCount(data.items?.length ?? 0))
          .catch(() => setCount(0));
      } else {
        setCount(getGuestCartCount());
      }
    };

    refresh();
    window.addEventListener("cart-updated", refresh);
    return () => window.removeEventListener("cart-updated", refresh);
  }, [user]);

  return count;
}
