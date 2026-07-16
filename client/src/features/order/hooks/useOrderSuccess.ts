import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { fetchOrderQr } from "@/lib/api/qr";
import type { OrderQr } from "@/types/api";

// Logic for the order-success screen — reads the order id from the URL and loads
// its tracking QR code. The component only renders the confirmation + QR.
export function useOrderSuccess() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const [qr, setQr] = useState<OrderQr | null>(null);

  useEffect(() => {
    if (!orderId) return;
    fetchOrderQr(orderId).then(setQr).catch(() => {});
  }, [orderId]);

  return { orderId, qr };
}
