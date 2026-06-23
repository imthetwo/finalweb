// Server Component — thin page, delegates to OrdersManager (Client)
import { OrdersManager } from "@/features/admin/components/OrdersManager";

export default function AdminOrdersPage() {
  return <OrdersManager />;
}
