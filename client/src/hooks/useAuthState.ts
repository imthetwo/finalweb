"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { clearToken, initAuth } from "@/lib/auth";

export type { AuthUser } from "@/store/authStore";

export function useAuthState() {
  const user = useAuthStore((s) => s.user);
  const loaded = useAuthStore((s) => s.loaded);

  // Khởi tạo auth từ localStorage lần đầu mount
  useEffect(() => {
    if (!loaded) initAuth();
  }, [loaded]);

  const logout = () => {
    clearToken();
    window.location.href = "/";
  };

  const refresh = () => initAuth();

  return { user, loaded, logout, refresh };
}
