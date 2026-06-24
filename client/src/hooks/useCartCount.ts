"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type CartResponse = { items: unknown[] };

export function useCartCount() {
  const [count, setCount] = useState(0);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    apiFetch<CartResponse>("/cart")
      .then((data) => setCount(user ? (data.items?.length ?? 0) : 0))
      .catch(() => setCount(0));
  }, [user]); // re-fetch khi user thay đổi (login/logout)

  return count;
}
