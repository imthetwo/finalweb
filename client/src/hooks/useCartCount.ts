"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type CartResponse = { items: unknown[] };

export function useCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    apiFetch<CartResponse>("/cart")
      .then((data) => setCount(data.items?.length ?? 0))
      .catch(() => setCount(0));
  }, []);

  return count;
}
