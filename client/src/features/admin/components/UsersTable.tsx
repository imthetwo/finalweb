"use client";
// "use client" vì: useState, useEffect, event handlers

import { useUsersTable, type UserRole } from "../hooks/useUsersTable";

const ROLE_STYLES: Record<UserRole, string> = {
  ADMIN: "text-brand",
  STAFF: "text-warning",
  USER:  "text-muted",
};

export function UsersTable() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { me, users, loading, changing, handleRoleChange } = useUsersTable();

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
