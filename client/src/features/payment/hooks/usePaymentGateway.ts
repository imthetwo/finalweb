import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { confirmPayment, fetchPaymentStatus, initiatePayment } from "@/lib/api";
import type { InitiatePaymentResponse } from "@/types/api";

const POLL_INTERVAL = 3000; // 3 s

// Logic for the payment gateway screen — MoMo hosted checkout: initiates the
// payment, then polls the IPN status while the customer pays on MoMo's page.
// The component only renders based on what this returns.
export function usePaymentGateway() {
  const { method } = useParams<{ method: string }>();
  const router = useRouter();
  const search = useSearchParams();

  const orderId = search.get("orderId") ?? "";
  const amount = Number(search.get("amount") ?? 0);
  const isMomo = method?.toLowerCase() === "momo";

  const [payment, setPayment] = useState<InitiatePaymentResponse | null>(null);
  const [orderAmount, setOrderAmount] = useState(0);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [processing, setProcessing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 1. On mount: check the order first (covers MoMo redirecting the browser
  //      back here after a hosted-page payment), then initiate if needed ─────
  useEffect(() => {
    if (!orderId) return;

    fetchPaymentStatus(orderId)
      .then((s) => {
        if (s.isPaid) {
          toast.success("Payment received!");
          router.replace(`/order-success?orderId=${orderId}`);
          return;
        }
        setOrderAmount(s.totalAmount);
        if (!isMomo) {
          setLoading(false);
          return;
        }
        return initiatePayment(orderId).then((data) => {
          setPayment(data);
          setLoading(false);
        });
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not load order");
        setLoading(false);
      });
  }, [orderId, isMomo, router]);

  // ── 2. Poll IPN status while the customer pays on MoMo's hosted page ─────
  useEffect(() => {
    if (payment?.source !== "momo") return;

    // Poll for real IPN (works when backend is publicly reachable via ngrok/deploy)
    pollRef.current = setInterval(async () => {
      try {
        const status = await fetchPaymentStatus(orderId);
        if (status.isPaid) {
          clearInterval(pollRef.current!);
          toast.success("Payment received!");
          router.push(`/order-success?orderId=${orderId}`);
        }
      } catch {
        // ignore poll errors
      }
    }, POLL_INTERVAL);

    return () => {
      clearInterval(pollRef.current!);
    };
  }, [payment, orderId, router]);

  // ── Confirm payment (manual or auto) ─────────────────────────────────────
  async function pay(success: boolean) {
    if (!orderId) { toast.error("Missing order ID"); return; }
    setProcessing(true);
    try {
      await confirmPayment(orderId, success);
      if (success) {
        toast.success("Payment successful!");
        router.push(`/order-success?orderId=${orderId}`);
      } else {
        toast.error("Payment cancelled");
        router.push("/account");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment error");
    } finally {
      setProcessing(false);
    }
  }

  const displayAmount = payment?.amount ?? orderAmount ?? amount;
  const methodLabel = (method ?? "PAYMENT").toUpperCase();

  return { orderId, isMomo, payment, loading, processing, displayAmount, methodLabel, pay };
}
