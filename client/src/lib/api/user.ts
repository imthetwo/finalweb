import type { UserProfile, WishlistEntry, Review, ReviewSummary } from "@/types/api";
import { apiFetch } from "./client";

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

// ── Wishlist ──────────────────────────────────────────────────────────────────

export const fetchWishlist = () =>
  apiFetch<WishlistEntry[]>("/wishlist");

export const addToWishlist = (productId: string) =>
  apiFetch<{ ok: boolean }>("/wishlist", { method: "POST", body: JSON.stringify({ productId }) });

export const removeFromWishlist = (productId: string) =>
  apiFetch<{ ok: boolean }>(`/wishlist/${productId}`, { method: "DELETE" });

// ── Reviews ───────────────────────────────────────────────────────────────────

export const fetchProductReviews = (productId: string) =>
  apiFetch<ReviewSummary>(`/reviews/product/${productId}`);

export const createReview = (data: { productId: string; rating: number; title?: string; text?: string }) =>
  apiFetch<Review>("/reviews", { method: "POST", body: JSON.stringify(data) });
