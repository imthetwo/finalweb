"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { clearToken, initAuth } from "@/lib/auth";

export type { AuthUser } from "@/store/authStore";

export function useAuthState() {
  const user = useAuthStore((s) => s.user);
  const loaded = useAuthStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) initAuth();
  }, [loaded]);

  // Cross-tab sync: e.g. clicking the email-verify link opens /verify-email
  // in a new tab, which updates localStorage's token there — this tab's
  // Zustand store only learns about it via the browser's "storage" event
  // (which fires in every OTHER tab, never the one that made the change).
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "access_token") initAuth();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const logout = () => {
    clearToken();
    window.location.href = "/";
  };

  const refresh = () => initAuth();

  return { user, loaded, logout, refresh };
}
