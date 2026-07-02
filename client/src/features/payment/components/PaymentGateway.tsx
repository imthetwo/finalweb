"use client";
// "use client" vì: useState, useEffect (polling), useParams, useSearchParams, event handlers

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, XCircle, RefreshCw, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { apiFetch, confirmPayment, initiatePayment } from "@/lib/api";
import { formatVnd } from "@/lib/format";

type InitiateResponse = {
  orderId: string;
  amount: number;
  payUrl: string | null;
  qrCodeUrl: string | null;
  source: "momo" | "simulated";
};

type PaymentStatus = {
  orderId: string;
  isPaid: boolean;
  status: string;
};

const POLL_INTERVAL = 3000; // 3 s

export function PaymentGateway() {
  const { method } = useParams<{ method: string }>();
  const router = useRouter();
  const search = useSearchParams();

  const orderId  = search.get("orderId") ?? "";
  const amount   = Number(search.get("amount") ?? 0);
  const isMomo   = method?.toLowerCase() === "momo";

  const [payment, setPayment]       = useState<InitiateResponse | null>(null);
  const [loading, setLoading]       = useState(Boolean(orderId));
  const [processing, setProcessing] = useState(false);
  const [expired, setExpired]       = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 1. Call /payments/initiate on mount ──────────────────────────────────
  useEffect(() => {
    if (!orderId) return;

    initiatePayment(orderId)
      .then((data) => {
        setPayment(data as InitiateResponse);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not initiate payment");
        setLoading(false);
      });
  }, [orderId]);

  // ── 2. Poll IPN status when real MoMo QR is visible ─────────────────────
  useEffect(() => {
    if (!payment?.qrCodeUrl || payment.source !== "momo") return;

    // Poll for real IPN (works when backend is publicly reachable via ngrok/deploy)
    pollRef.current = setInterval(async () => {
      try {
        const status = await apiFetch<PaymentStatus>(`/payments/status/${orderId}`);
        if (status.isPaid) {
          clearInterval(pollRef.current!);
          toast.success("Payment received!");
          router.push(`/order-success?orderId=${orderId}`);
        }
      } catch {
        // ignore poll errors
      }
    }, POLL_INTERVAL);

    // QR expires after 10 minutes
    const expireTimer = setTimeout(() => {
      clearInterval(pollRef.current!);
      setExpired(true);
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(pollRef.current!);
      clearTimeout(expireTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-base text-fg">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-brand" />
          <p className="text-sm text-secondary">Connecting to MoMo…</p>
        </div>
      </main>
    );
  }

  if (!orderId) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-base text-fg">
        <p className="text-destructive">Missing order ID.</p>
      </main>
    );
  }

  const displayAmount = payment?.amount ?? amount;
  const methodLabel   = (method ?? "MOMO").toUpperCase();

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-base px-4 py-10 text-fg">
      <div className="w-full max-w-sm border border-edge bg-elevated">

        {/* Header */}
        <div className="border-b border-edge bg-[linear-gradient(180deg,#2d1b3d_0%,#111_100%)] px-6 py-5 text-center">
          <p className="text-2xs font-bold uppercase tracking-[0.3em] text-pink-400">
            Payment Gateway
          </p>
          <h1 className="mt-1 text-xl font-black uppercase tracking-wide">{methodLabel}</h1>
        </div>

        <div className="space-y-5 p-6">
          {/* Amount */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-muted">Amount</p>
            <p className="mt-1 text-3xl font-black text-brand">{formatVnd(displayAmount)}</p>
            <p className="mt-1 font-mono text-xs text-subtle">
              Order #{orderId.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* ── Real MoMo QR ── */}
          {isMomo && payment?.qrCodeUrl && !expired && (
            <div className="flex flex-col items-center gap-3">
              <div className="border border-edge bg-white p-4">
                <QRCodeSVG
                  value={payment.qrCodeUrl}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-center text-xs leading-relaxed text-muted">
                Open <span className="font-bold text-pink-400">MoMo app</span> → scan QR to pay.
                <br />
                {processing
                  ? <span className="font-bold text-pink-400">Processing payment…</span>
                  : "Waiting for payment confirmation…"}
              </p>
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                <div className="h-full animate-[shrink_600s_linear_forwards] bg-brand" />
              </div>
            </div>
          )}

          {/* Expired QR */}
          {isMomo && expired && (
            <div className="rounded border border-red-800/40 bg-red-950/20 px-4 py-3 text-center">
              <p className="text-sm font-bold text-destructive">QR code expired</p>
              <button
                type="button"
                onClick={() => { setExpired(false); window.location.reload(); }}
                className="mt-2 text-sm text-secondary underline hover:text-fg"
              >
                Generate new QR
              </button>
            </div>
          )}

          {/* Open in MoMo app / web */}
          {isMomo && payment?.payUrl && (
            <a
              href={payment.payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 border border-pink-700/50 bg-pink-950/20 py-2.5 text-sm font-bold uppercase tracking-wider text-pink-400 transition hover:bg-pink-950/40"
            >
              <ExternalLink size={13} /> Open MoMo wallet
            </a>
          )}

          {/* ── Simulated fallback (when MoMo API is unreachable) ── */}
          {(!isMomo || payment?.source === "simulated" || !payment?.qrCodeUrl) && (
            <>
              <button
                type="button"
                onClick={() => pay(true)}
                disabled={processing}
                className="inline-flex w-full items-center justify-center gap-2 bg-brand py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-brand/85 disabled:opacity-50"
              >
                <ShieldCheck size={15} />
                {processing ? "Processing…" : "Simulate payment success"}
              </button>

              <button
                type="button"
                onClick={() => pay(false)}
                disabled={processing}
                className="inline-flex w-full items-center justify-center gap-2 border border-edge py-2.5 text-sm font-bold uppercase tracking-wider text-secondary transition hover:border-destructive hover:text-destructive disabled:opacity-50"
              >
                <XCircle size={14} /> Cancel payment
              </button>

              <p className="text-center text-2xs text-subtle">
                {payment?.source === "simulated"
                  ? "MoMo sandbox unreachable — using simulated flow."
                  : "Demo gateway for non-MoMo payments."}
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
