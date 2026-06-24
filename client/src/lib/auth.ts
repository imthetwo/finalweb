"use client";

import { useAuthStore } from "@/store/authStore";

const KEY = "access_token";
const MAX_AGE = 60 * 60; // 1 hour — khớp với JWT expiry

function parseJwt(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
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
