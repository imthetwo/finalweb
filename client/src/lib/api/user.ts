import type { UserProfile, WishlistEntry } from "@/types/api";
import { apiFetch } from "./client";

// ── Profile ───────────────────────────────────────────────────────────────────

export const fetchProfile = () =>
  apiFetch<UserProfile>("/users/me");

export const updateProfile = (data: Partial<Pick<UserProfile, "fullName" | "phone">>) =>
  apiFetch<UserProfile>("/users/me", { method: "PATCH", body: JSON.stringify(data) });

export const changePassword = (currentPassword: string, newPassword: string) =>
  apiFetch<{ ok: boolean; message: string }>("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

// ── Wishlist ──────────────────────────────────────────────────────────────────

export const fetchWishlist = () =>
  apiFetch<WishlistEntry[]>("/wishlist");

export const addToWishlist = (productId: string) =>
  apiFetch<{ ok: boolean }>("/wishlist", { method: "POST", body: JSON.stringify({ productId }) });

export const removeFromWishlist = (productId: string) =>
  apiFetch<{ ok: boolean }>(`/wishlist/${productId}`, { method: "DELETE" });

