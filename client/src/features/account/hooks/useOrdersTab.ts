import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { fetchOrders, cancelOrder, type Order } from "@/lib/api";

// Data/logic for the account Orders tab — loading the order list, resuming
// payment for an unpaid order, and cancelling. The component only renders.
export function useOrdersTab() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  // Resume payment for an unpaid order → back to its gateway page.
  function payOrder(order: Order) {
    router.push(`/payment/${order.paymentMethod.toLowerCase()}?orderId=${order.id}`);
  }

  async function handleCancel(orderId: string) {
    if (!confirm("Cancel this order? Stock will be restored.")) return;
    setCancelling(orderId);
    try {
      const updated = await cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (selectedOrder?.id === updated.id) setSelectedOrder(updated);
      toast.success("Order cancelled.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel order.");
    } finally {
      setCancelling(null);
    }
  }

  return { orders, loading, cancelling, selectedOrder, setSelectedOrder, handleCancel, payOrder };
}
