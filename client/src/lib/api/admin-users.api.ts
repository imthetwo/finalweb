import type { AdminUser, UserRole } from "@/types/api";
import { apiFetch } from "./client";

export const fetchAdminUsers = (page = 1) =>
  apiFetch<AdminUser[]>(`/admin/users?page=${page}`);

// PATCH /admin/users/:id/role — ADMIN ONLY
export const updateAdminUserRole = (id: string, role: UserRole) =>
  apiFetch<{ id: string; email: string; fullName: string; role: string }>(
    `/admin/users/${id}/role`,
    { method: "PATCH", body: JSON.stringify({ role }) },
  );
