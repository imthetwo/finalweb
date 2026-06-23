"use client";

const KEY = "access_token";
const MAX_AGE = 60 * 60; // 1 hour — khớp với JWT expiry

export function saveToken(token: string) {
  localStorage.setItem(KEY, token);
  // Set cookie để Server Components (admin dashboard) đọc được
  document.cookie = `${KEY}=${token}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  window.dispatchEvent(new Event("auth:change"));
}

export function clearToken() {
  localStorage.removeItem(KEY);
  // Xóa cookie
  document.cookie = `${KEY}=; path=/; max-age=0; SameSite=Lax`;
  window.dispatchEvent(new Event("auth:change"));
}

export function getToken(): string | null {
  return localStorage.getItem(KEY);
}
