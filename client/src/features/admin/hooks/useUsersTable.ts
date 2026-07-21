import { useEffect, useState } from "react";
import { toast } from "sonner";

import { fetchAdminUsers, updateAdminUserRole } from "@/lib/api/admin-users.api";
import { useAuthState } from "@/hooks/useAuthState";
import { confirmDialog } from "@/store/confirmStore";
import type { AdminUser, UserRole } from "@/types/api";


export function useUsersTable() {
  const { user: me } = useAuthState();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminUsers()
      .then(setUsers)
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(u: AdminUser, newRole: UserRole) {
    if (newRole === u.role) return;
    const label = newRole === "STAFF" ? "promote to Staff" : newRole === "ADMIN" ? "promote to Admin" : "demote to User";
    if (!(await confirmDialog(`${label} "${u.fullName}"?`, "Change role?"))) return;

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

  return { me, users, loading, changing, handleRoleChange };
}
