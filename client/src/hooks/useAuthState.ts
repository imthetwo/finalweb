"use client";

import { useEffect, useState } from "react";

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

export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setUser(token ? parseJwt(token) : null);
    setLoaded(true);
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    window.location.href = "/";
  };

  const refresh = () => {
    const token = localStorage.getItem("access_token");
    setUser(token ? parseJwt(token) : null);
  };

  return { user, loaded, logout, refresh };
}
