import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { getApiUrl } from "@/lib/api";

type OrderQr = { dataUrl: string; status: string; total: number };

// Logic for the order-success screen — reads the order id from the URL and loads
// its tracking QR code. The component only renders the confirmation + QR.
export function useOrderSuccess() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const [qr, setQr] = useState<OrderQr | null>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(getApiUrl(`/qr/order/${orderId}`))
      .then((r) => (r.ok ? r.json() : null))
      .then(setQr)
      .catch(() => {});
  }, [orderId]);

  return { orderId, qr };
}
