import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { confirmGuestCheckout } from "@/lib/api";
import { clearGuestCart } from "@/lib/guestCart";
import type { Order } from "@/types/api";

type Status = "confirming" | "success" | "error";

// Logic for the /guest-checkout/confirm screen — grabs the token from the
// URL and confirms it with the backend on mount, which is what actually
// creates the order. The component only renders based on the resulting status.
export function useGuestCheckoutConfirmPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>(token ? "confirming" : "error");
  const [order, setOrder] = useState<Order | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) return;
    confirmGuestCheckout(token)
      .then((created) => {
        setOrder(created);
        setStatus("success");
        // The order is real now — clear the localStorage "session cart" and
        // refresh the header badge, same as the old immediate-checkout flow did.
        clearGuestCart();
        window.dispatchEvent(new Event("cart-updated"));
        // Lets the order-success page's "View orders" link jump straight into
        // the order detail on /track-order without retyping the phone number.
        sessionStorage.setItem(`track:${created.id}`, created.shippingInfo.phone ?? "");

        redirectTimerRef.current = setTimeout(() => {
          if (created.paymentMethod === "COD") {
            router.push(`/order-success?orderId=${created.id}`);
          } else {
            router.push(`/payment/${created.paymentMethod.toLowerCase()}?orderId=${created.id}`);
          }
        }, 1500);
      })
      .catch(() => setStatus("error"));

    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [token, router]);

  return { status, order };
}
