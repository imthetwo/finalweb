import { useEffect, useState } from "react";

import { trackOrder, type Order } from "@/lib/api";

// Data/logic for a single order's detail view at /track-order/[id]. If the
// phone was already verified on the search page (or right after guest
// checkout), sessionStorage carries it over so this loads with zero extra
// input. Otherwise it falls back to asking for the phone right here, so a
// bookmarked/shared link still works as long as you know the phone number.
export function useTrackOrderDetail(orderId: string) {
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPhone, setNeedsPhone] = useState(false);

  async function lookup(ph: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await trackOrder(orderId, ph);
      setOrder(result);
      sessionStorage.setItem(`track:${orderId}`, ph);
      setNeedsPhone(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order not found.");
      setNeedsPhone(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(`track:${orderId}`);
    if (saved) {
      setPhone(saved);
      void lookup(saved);
    } else {
      setNeedsPhone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  function submitPhone(e: React.FormEvent) {
    e.preventDefault();
    void lookup(phone.trim());
  }

  return { phone, setPhone, order, loading, error, needsPhone, submitPhone };
}
