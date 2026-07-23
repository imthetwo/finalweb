import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { fetchOrderQr } from "@/lib/api/qr";
import { fetchOrder } from "@/lib/api/orders";
import { useAuthState } from "@/hooks/useAuthState";
import type { OrderQr } from "@/types/api";

// Logic for the order-success screen — reads the order id from the URL and loads
// its tracking QR code. The component only renders the confirmation + QR.
export function useOrderSuccess() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const [qr, setQr] = useState<OrderQr | null>(null);
  const { user, loaded: authLoaded } = useAuthState();

  // Guest checkout can be placed under a different email than the account
  // the shopper happens to be signed in as (e.g. a gift, checked out while
  // still logged in elsewhere) — that order never gets attached to this
  // account. "My orders" always points at the account's own list regardless
  // (nothing to compute there), but the component uses this to explain why
  // the order won't show up in it. Only known once fetchOrder(orderId)
  // (authenticated) actually succeeds.
  const [belongsToAccount, setBelongsToAccount] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    fetchOrderQr(orderId).then(setQr).catch(() => {});
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !authLoaded || !user) return;
    fetchOrder(orderId)
      .then(() => setBelongsToAccount(true))
      .catch(() => setBelongsToAccount(false));
  }, [orderId, authLoaded, user]);

  return { orderId, qr, user, belongsToAccount };
}
