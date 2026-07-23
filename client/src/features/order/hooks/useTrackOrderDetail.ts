import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trackOrder, cancelGuestOrder, fetchOrder, type Order } from "@/lib/api";
import { confirmDialog } from "@/store/confirmStore";
import { useAuthState } from "@/hooks/useAuthState";

// Data/logic for a single order's detail view at /track-order/[id]. If the
// phone was already verified on the search page (or right after guest
// checkout), sessionStorage carries it over so this loads with zero extra
// input. Otherwise it falls back to asking for the phone right here, so a
// bookmarked/shared link still works as long as you know the phone number.
export function useTrackOrderDetail(orderId: string) {
  const router = useRouter();
  const { user, loaded: authLoaded } = useAuthState();
  const wasGuest = useRef(false);

  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // If a guest signs in (Header's overlay) while sitting on this exact page,
  // this specific order only got claimed into that account if its guestEmail
  // matches the account's own email — a customer may deliberately use a
  // different email for one order (e.g. a gift shipped/tracked via someone
  // else's inbox), and that order must stay reachable exactly as before
  // (guest-scoped by phone), not vanish just because they happen to be
  // logged in elsewhere. So: ask the account's own endpoint whether it can
  // see this order now — only redirect if the answer is yes. Only runs on
  // the transition (arriving already logged in is fine — that's a normal
  // way to look up someone else's order for them).
  useEffect(() => {
    if (!authLoaded) return;
    if (!user) { wasGuest.current = true; return; }
    if (!wasGuest.current) return;
    wasGuest.current = false;

    fetchOrder(orderId)
      .then(() => {
        toast.message("You're signed in — showing this order in your account.");
        router.replace("/account?tab=orders");
      })
      .catch(() => {
        // Different email on this order — stays a guest order, on purpose.
        // The phone-verified view/cancel above still works exactly as before.
      });
  }, [user, authLoaded, router, orderId]);

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

  // The verified phone from lookup() above doubles as this guest's proof of
  // ownership for cancelling — same rule the server enforces.
  async function cancelThisOrder() {
    if (!(await confirmDialog("Stock will be restored.", "Cancel this order?"))) return;
    setCancelling(true);
    try {
      const updated = await cancelGuestOrder(orderId, phone);
      setOrder(updated);
      toast.success("Order cancelled.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  }

  return { phone, setPhone, order, loading, error, needsPhone, cancelling, submitPhone, cancelThisOrder };
}
