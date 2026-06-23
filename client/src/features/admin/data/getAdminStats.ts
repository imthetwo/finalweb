import type { AdminStats } from "@/types/api";

const API = process.env.API_URL ?? "http://localhost:3001";

export async function getAdminStats(token: string): Promise<AdminStats | null> {
  try {
    const res = await fetch(`${API}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<AdminStats>;
  } catch {
    return null;
  }
}
