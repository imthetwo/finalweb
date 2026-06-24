"use client";
// "use client" vì: useState, useCallback, useEffect, event handlers (CRUD, pagination)

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  _count: { orders: number };
};

export function UsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminUser[]>("/admin/users").then(setUsers).catch(() => setUsers([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-black uppercase tracking-wide text-fg">Users</h1>

      <div className="border border-edge bg-elevated">
        <table className="w-full text-body">
          <thead className="border-b border-edge text-[10px] uppercase tracking-wider text-muted">
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
              users.map((u) => (
                <tr key={u.id} className="border-b border-edge/50">
                  <td className="px-4 py-3 font-semibold text-fg">{u.fullName}</td>
                  <td className="px-4 py-3 text-secondary">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-bold uppercase ${u.role === "ADMIN" ? "text-brand" : "text-muted"}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-secondary">{u._count.orders}</td>
                  <td className="px-4 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString("en-GB")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
