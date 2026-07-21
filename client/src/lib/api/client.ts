// Base HTTP client — used for all API calls

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const serverApiUrl = API_URL;

export function getApiUrl(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

// A cold-starting backend (e.g. Render's free tier spinning back up from idle)
// can take 30-60s+ to respond. Without a timeout, callers just hang forever
// with no feedback (e.g. a "Creating account…" button stuck indefinitely) —
// fail with a clear, actionable message instead. Shared by apiFetch below and
// by callers (auth.ts) that need the raw Response instead of apiFetch's parsed
// JSON + generic error handling.
const TIMEOUT_MS = 45_000;
// File uploads/downloads can legitimately take longer than a plain JSON call.
export const LONG_TIMEOUT_MS = 120_000;

export async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error("The server is taking too long to respond — it may be waking up from idle. Please try again in a moment.");
    }
    throw err;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const isGet = !init?.method || init.method === "GET";
  const nextOptions = isGet && !token ? { next: { revalidate: 30 } } : {};
  // credentials: 'include' sends session cookies (architecture requirement)
  const res = await fetchWithTimeout(getApiUrl(path), { credentials: "include", ...init, ...nextOptions, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}
