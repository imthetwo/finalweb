// Server Component — displays stats, no interaction
import { DollarSign, Package, ShoppingBag, Users } from "lucide-react";
import type { AdminStats } from "@/types/api";
import { formatVnd, ORDER_STATUS_TEXT_CLASS as STATUS_COLOR } from "@/lib/format";

const CARDS = (s: AdminStats) => [
  { label: "Revenue (paid)", value: formatVnd(s.totalRevenue), Icon: DollarSign, accent: "text-brand" },
  { label: "Orders",         value: s.orderCount,              Icon: ShoppingBag,  accent: "text-info" },
  { label: "Customers",      value: s.userCount,               Icon: Users,        accent: "text-success" },
  { label: "Products",       value: s.productCount,            Icon: Package,      accent: "text-purple-400" },
];

export function DashboardView({ stats }: { stats: AdminStats }) {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-black uppercase tracking-wide text-fg">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {CARDS(stats).map(({ label, value, Icon, accent }) => (
          <div key={label} className="border border-edge bg-elevated p-5">
            <Icon size={18} className={accent} />
            <p className="mt-3 text-2xl font-black text-fg">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="border border-edge bg-elevated">
        <div className="border-b border-edge px-5 py-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-fg">Recent Orders</h2>
        </div>
        <table className="w-full text-body">
          <thead className="border-b border-edge text-2xs uppercase tracking-wider text-muted">
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
                <td className="px-5 py-3 text-fg">{o.user?.fullName ?? "—"}</td>
                <td className="px-5 py-3 text-right font-bold text-fg">{formatVnd(o.totalAmount)}</td>
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
