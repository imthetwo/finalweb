"use client";

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminUser[]>("/admin/users").then(setUsers).catch(() => setUsers([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-black uppercase tracking-wide text-white">Users</h1>

      <div className="border border-zinc-800 bg-[#111]">
        <table className="w-full text-[13px]">
          <thead className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
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
              <tr><td colSpan={5} className="px-4 py-10 text-center text-zinc-600">Loading…</td></tr>
            ) : !users.length ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-zinc-600">No users.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-800/50">
                  <td className="px-4 py-3 font-semibold text-white">{u.fullName}</td>
                  <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-bold uppercase ${u.role === "ADMIN" ? "text-[#00ffff]" : "text-zinc-500"}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-300">{u._count.orders}</td>
                  <td className="px-4 py-3 text-zinc-500">{new Date(u.createdAt).toLocaleDateString("en-GB")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
