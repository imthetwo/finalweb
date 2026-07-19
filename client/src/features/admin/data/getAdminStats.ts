import type { AdminStats } from "@/types/api";
import { serverApiUrl } from "@/lib/api/client";

export async function getAdminStats(token: string): Promise<AdminStats | null> {
  try {
    const res = await fetch(`${serverApiUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<AdminStats>;
  } catch {
    return null;
  }
}
