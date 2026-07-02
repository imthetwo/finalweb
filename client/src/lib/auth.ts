"use client";

import { useAuthStore } from "@/store/authStore";

const KEY = "access_token";
const MAX_AGE = 60 * 60; // 1 hour — khớp với JWT expiry

function parseJwt(token: string) {
  try {
    // JWT uses Base64url (- and _ instead of + and /). atob() needs standard Base64.
    // Then re-encode each byte as %XX so decodeURIComponent can reconstruct UTF-8
    // correctly — plain atob() returns Latin-1 which mangles multi-byte chars (e.g. Vietnamese).
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const payload = JSON.parse(json);
    return {
      id: payload.sub ?? "",
      email: payload.email ?? "",
      fullName: payload.fullName || payload.name || payload.email?.split("@")[0] || "User",
      role: payload.role ?? "USER",
    } as import("@/store/authStore").AuthUser;
  } catch {
    return null;
  }
}

export function saveToken(token: string) {
  localStorage.setItem(KEY, token);
  document.cookie = `${KEY}=${token}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  // Cập nhật Zustand store ngay lập tức
  const user = parseJwt(token);
  useAuthStore.getState().setUser(user);
  useAuthStore.getState().setLoaded(true);
}

export function clearToken() {
  localStorage.removeItem(KEY);
  document.cookie = `${KEY}=; path=/; max-age=0; SameSite=Lax`;
  useAuthStore.getState().setUser(null);
}

export function getToken(): string | null {
  return localStorage.getItem(KEY);
}

export function initAuth() {
  const token = localStorage.getItem(KEY);
  const user = token ? parseJwt(token) : null;
  useAuthStore.getState().setUser(user);
  useAuthStore.getState().setLoaded(true);
}
