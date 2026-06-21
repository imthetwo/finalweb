// Base HTTP client — dùng cho tất cả API calls

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const serverApiUrl = API_URL;

export function getApiUrl(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
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
  const res = await fetch(getApiUrl(path), { ...init, ...nextOptions, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}
