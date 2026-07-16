// Server Component — fetches stats and renders the dashboard
import { cookies } from "next/headers";
import { getAdminStats } from "@/features/admin/data/getAdminStats";
import { DashboardView } from "./DashboardView";

export async function AdminDashboard() {
  const token = (await cookies()).get("access_token")?.value ?? "";
  const stats = await getAdminStats(token);

  if (!stats) {
    return <p className="p-8 text-muted">Could not load stats — check API connection.</p>;
  }

  return <DashboardView stats={stats} />;
}
