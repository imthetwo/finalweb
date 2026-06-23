"use client";

import { useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/auth";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
};

function parseJwt(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.sub ?? "",
      email: payload.email ?? "",
      fullName: payload.fullName || payload.name || payload.email?.split("@")[0] || "User",
      role: payload.role ?? "USER",
    };
  } catch {
    return null;
  }
}

function readUser(): AuthUser | null {
  const token = getToken();
  return token ? parseJwt(token) : null;
}

export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setUser(readUser());
    setLoaded(true);

    // Lắng nghe event auth:change để cập nhật ngay khi login/logout
    const handleChange = () => setUser(readUser());
    window.addEventListener("auth:change", handleChange);
    return () => window.removeEventListener("auth:change", handleChange);
  }, []);

  const logout = () => {
    clearToken();
    window.location.href = "/";
  };

  const refresh = () => setUser(readUser());

  return { user, loaded, logout, refresh };
}
