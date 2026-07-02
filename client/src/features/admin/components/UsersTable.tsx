"use client";
// "use client" vì: useState, useEffect, event handlers

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { updateAdminUserRole } from "@/lib/api/admin";
import { useAuthState } from "@/hooks/useAuthState";

type UserRole = "USER" | "STAFF" | "ADMIN";

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number };
};

const ROLE_STYLES: Record<UserRole, string> = {
  ADMIN: "text-brand",
  STAFF: "text-warning",
  USER:  "text-muted",
};

export function UsersTable() {
  const { user: me } = useAuthState();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AdminUser[]>("/admin/users")
      .then(setUsers)
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(u: AdminUser, newRole: UserRole) {
    if (newRole === u.role) return;
    const label = newRole === "STAFF" ? "promote to Staff" : newRole === "ADMIN" ? "promote to Admin" : "demote to User";
    if (!confirm(`${label} "${u.fullName}"?`)) return;

    setChanging(u.id);
    try {
      const updated = await updateAdminUserRole(u.id, newRole);
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role: updated.role as UserRole } : x));
      toast.success(`${u.fullName} is now ${updated.role}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setChanging(null);
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-black uppercase tracking-wide text-fg">Users</h1>

      <div className="border border-edge bg-elevated">
        <table className="w-full text-body">
          <thead className="border-b border-edge text-2xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-center">Role</th>
              <th className="px-4 py-3 text-center">Orders</th>
              <th className="px-4 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-subtle">Loading…</td></tr>
            ) : !users.length ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-subtle">No users.</td></tr>
            ) : (
              users.map((u) => {
                const isSelf = u.id === me?.id;
                return (
                  <tr key={u.id} className="border-b border-edge/50">
                    <td className="px-4 py-3 font-semibold text-fg">{u.fullName}</td>
                    <td className="px-4 py-3 text-secondary">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      {isSelf ? (
                        <span className={`text-2xs font-bold uppercase ${ROLE_STYLES[u.role]}`}>{u.role}</span>
                      ) : (
                        <select
                          value={u.role}
                          disabled={changing === u.id}
                          onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                          className={`border border-edge bg-surface px-2 py-0.5 text-2xs font-bold uppercase outline-none focus:border-brand/50 disabled:opacity-50 ${ROLE_STYLES[u.role]}`}
                        >
                          <option value="USER">USER</option>
                          <option value="STAFF">STAFF</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-secondary">{u._count.orders}</td>
                    <td className="px-4 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString("en-GB")}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
