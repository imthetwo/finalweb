// GET /settings/:key  — public, dùng trong Server Components
import { apiFetch, serverApiUrl } from "./client";

export async function getSetting(key: string): Promise<string | null> {
  try {
    // A cold-starting backend (e.g. Render's free tier spinning back up) can
    // take 30-60s+ to respond — that would otherwise hang this call past
    // Vercel's build-time prerender budget. Fail fast and fall back instead.
    const res = await fetch(`${serverApiUrl}/settings/${key}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { key: string; value: string | null };
    return data.value ?? null;
  } catch {
    return null;
  }
}

// GET /settings/:key — client-authenticated read, used by admin settings forms
export async function fetchSettingValue(key: string): Promise<string> {
  try {
    const r = await apiFetch<{ key: string; value: string | null }>(`/settings/${key}`);
    return r.value ?? "";
  } catch {
    return "";
  }
}

// PATCH /settings/:key — ADMIN ONLY
export const updateSettingValue = (key: string, value: string) =>
  apiFetch(`/settings/${key}`, { method: "PATCH", body: JSON.stringify({ value }) });
