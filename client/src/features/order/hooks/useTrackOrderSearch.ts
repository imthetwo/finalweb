import { useState } from "react";
import { useRouter } from "next/navigation";

import { trackOrder } from "@/lib/api";

// Data/logic for the "track my order" search form — just finds the order,
// then hands off to /track-order/[id] for the actual detail view. The
// component only wires this to inputs and renders the error state.
export function useTrackOrderSearch() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = orderId.trim();
    const ph = phone.trim();
    setLoading(true);
    setError(null);
    try {
      await trackOrder(id, ph); // verify before navigating away
      // Hands the verified phone to the detail page via sessionStorage (tab-
      // scoped) so it isn't retyped and never sits in the URL/browser history.
      sessionStorage.setItem(`track:${id}`, ph);
      router.push(`/track-order/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order not found.");
    } finally {
      setLoading(false);
    }
  }

  return { orderId, setOrderId, phone, setPhone, loading, error, submit };
}
