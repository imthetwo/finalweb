import { apiFetch, fetchWithTimeout, getApiUrl } from "./client";
import { readBackendError } from "@/features/auth/utils/readBackendError";
import type { AuthUser } from "@/store/authStore";

export type AuthResponse = { access_token: string; user: AuthUser };
export type RegisterResponse = { ok: boolean; email: string };

// login/register need the raw Response to extract field-level validation
// messages via readBackendError (joins class-validator's array-shaped
// `message` field) — apiFetch's generic error handling doesn't format those
// the same way, so these go through fetch directly instead of apiFetch.
async function postAuthForm(path: string, body: unknown, fallback: string): Promise<AuthResponse> {
  const res = await fetchWithTimeout(getApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readBackendError(res, fallback));
  const data = (await res.json()) as Partial<AuthResponse>;
  if (!data?.access_token) throw new Error("No access token returned.");
  return data as AuthResponse;
}

export const login = (email: string, password: string) =>
  postAuthForm("/auth/login", { email, password }, "Login failed.");

// Registration no longer returns a session — the account can't be used until
// the emailed verification link is clicked (see verifyEmail() below).
export async function register(
  fullName: string, email: string, password: string, subscribeNewsletter: boolean,
): Promise<RegisterResponse> {
  const res = await fetchWithTimeout(getApiUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password, subscribeNewsletter }),
  });
  if (!res.ok) throw new Error(await readBackendError(res, "Registration failed."));
  return res.json();
}

export const forgotPassword = (email: string) =>
  apiFetch<{ ok: boolean }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });

export const resetPassword = (token: string, password: string) =>
  apiFetch<{ ok: boolean }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });

export const verifyEmail = (token: string) =>
  apiFetch<AuthResponse>("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) });

// Public — for a just-registered or login-blocked (unverified) user, who by
// definition has no session yet (registration issues no JWT until verified,
// and login itself is blocked while unverified).
export const resendVerificationByEmail = (email: string) =>
  apiFetch<{ ok: boolean }>("/auth/resend-verification-by-email", { method: "POST", body: JSON.stringify({ email }) });
