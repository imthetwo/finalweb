import { AdminSidebar } from "@/features/admin/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminSidebar>{children}</AdminSidebar>;
}
