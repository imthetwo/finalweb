// Server Component — không "use client", fetch data server-side
import { cookies } from "next/headers";
import { getAdminStats } from "@/features/admin/data/getAdminStats";
import { DashboardView } from "@/features/admin/components/DashboardView";

export default async function AdminDashboardPage() {
  const token = (await cookies()).get("access_token")?.value
    ?? "";

  const stats = await getAdminStats(token);

  if (!stats) {
    return <div className="p-8 text-muted">Could not load stats — check API connection.</div>;
  }

  return <DashboardView stats={stats} />;
}
