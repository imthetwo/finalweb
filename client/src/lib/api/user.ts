import type { UserProfile, WishlistEntry } from "@/types/api";
import { apiFetch, getApiUrl, getToken } from "./client";

// ── Profile ───────────────────────────────────────────────────────────────────

export const fetchProfile = () =>
  apiFetch<UserProfile>("/users/me");

export const updateProfile = (data: Partial<Pick<UserProfile, "fullName" | "email" | "phone" | "avatarUrl">>) =>
  apiFetch<UserProfile>("/users/me", { method: "PATCH", body: JSON.stringify(data) });

export const changePassword = (currentPassword: string, newPassword: string) =>
  apiFetch<{ ok: boolean; message: string }>("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

// POST /users/me/avatar — multipart upload, returns the full updated profile
export async function uploadAvatar(file: File): Promise<UserProfile> {
  const fd = new FormData();
  fd.append("file", file);
  const token = getToken();
  const res = await fetch(getApiUrl("/users/me/avatar"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

// ── Wishlist ──────────────────────────────────────────────────────────────────

export const fetchWishlist = () =>
  apiFetch<WishlistEntry[]>("/wishlist");

export const addToWishlist = (productId: string) =>
  apiFetch<{ ok: boolean }>("/wishlist", { method: "POST", body: JSON.stringify({ productId }) });

export const removeFromWishlist = (productId: string) =>
  apiFetch<{ ok: boolean }>(`/wishlist/${productId}`, { method: "DELETE" });

