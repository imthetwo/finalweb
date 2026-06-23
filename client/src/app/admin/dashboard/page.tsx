"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, Users, Package, AlertTriangle } from "lucide-react";

import { fetchAdminStats, type AdminStats } from "@/lib/api";
import { formatVnd } from "@/lib/format";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-yellow-400", PROCESSING: "text-blue-400",
  SHIPPED: "text-brand", DELIVERED: "text-emerald-400",
  CANCELLED: "text-muted", PAYMENT_FAILED: "text-red-400",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats().then(setStats).catch(() => setStats(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-muted">Loading dashboard…</div>;
  if (!stats) return <div className="p-8 text-muted">Could not load stats (is the API running?).</div>;

  const cards = [
    { label: "Revenue (paid)", value: formatVnd(stats.totalRevenue), icon: DollarSign, accent: "text-brand" },
    { label: "Orders", value: stats.orderCount, icon: ShoppingBag, accent: "text-blue-400" },
    { label: "Customers", value: stats.userCount, icon: Users, accent: "text-emerald-400" },
    { label: "Products", value: stats.productCount, icon: Package, accent: "text-purple-400" },
  ];

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-black uppercase tracking-wide text-white">Dashboard</h1>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="border border-edge bg-[#111] p-5">
            <Icon size={18} className={accent} />
            <p className="mt-3 text-2xl font-black text-white">{value}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
          </div>
        ))}
      </div>

      {stats.lowStockCount > 0 && (
        <div className="mb-6 flex items-center gap-2 border border-yellow-800/40 bg-yellow-950/20 px-4 py-3 text-[13px] text-yellow-300">
          <AlertTriangle size={15} /> {stats.lowStockCount} product(s) low on stock (≤5).
        </div>
      )}

      {/* Recent orders */}
      <div className="border border-edge bg-[#111]">
        <div className="border-b border-edge px-5 py-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-white">Recent Orders</h2>
        </div>
        <table className="w-full text-[13px]">
          <thead className="border-b border-edge text-[10px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-2.5 text-left">Order</th>
              <th className="px-5 py-2.5 text-left">Customer</th>
              <th className="px-5 py-2.5 text-right">Total</th>
              <th className="px-5 py-2.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentOrders.map((o) => (
              <tr key={o.id} className="border-b border-edge/50">
                <td className="px-5 py-3 font-mono text-secondary">#{o.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-5 py-3 text-white">{o.user?.fullName ?? "—"}</td>
                <td className="px-5 py-3 text-right font-bold text-white">{formatVnd(o.totalAmount)}</td>
                <td className={`px-5 py-3 font-bold ${STATUS_COLOR[o.status] ?? "text-secondary"}`}>{o.status}</td>
              </tr>
            ))}
            {!stats.recentOrders.length && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-subtle">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
