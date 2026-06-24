// GET /settings/:key  — public, dùng trong Server Components
import { serverApiUrl } from "./client";

export async function getSetting(key: string): Promise<string | null> {
  try {
    const res = await fetch(`${serverApiUrl}/settings/${key}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json() as { key: string; value: string | null };
    return data.value ?? null;
  } catch {
    return null;
  }
}
