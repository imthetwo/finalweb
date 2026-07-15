"use client";
// "use client" vì: useState, useEffect (polling), useParams, useSearchParams, event handlers

import { XCircle, RefreshCw, ExternalLink } from "lucide-react";

import { formatVnd } from "@/lib/format";
import { usePaymentGateway } from "../hooks/usePaymentGateway";

export function PaymentGateway() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { orderId, isMomo, payment, loading, processing, displayAmount, methodLabel, pay } =
    usePaymentGateway();

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-base text-fg">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-brand" />
          <p className="text-sm text-secondary">{isMomo ? "Connecting to MoMo…" : "Loading order…"}</p>
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

          {/* ── MoMo hosted checkout (ATM / VISA card on MoMo's page — no QR) ── */}
          {isMomo && payment?.payUrl && (
            <div className="space-y-3">
              <a
                href={payment.payUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 border border-pink-700/50 bg-pink-950/20 py-3 text-sm font-bold uppercase tracking-wider text-pink-400 transition hover:bg-pink-950/40"
              >
                <ExternalLink size={13} /> Pay with ATM / VISA card on MoMo
              </a>
              <p className="text-center text-xs leading-relaxed text-muted">
                You&apos;ll pay on MoMo&apos;s secure page, then be redirected back here.
                <br />
                {processing
                  ? <span className="font-bold text-pink-400">Processing payment…</span>
                  : "Waiting for payment confirmation…"}
              </p>
              <button
                type="button"
                onClick={() => pay(false)}
                disabled={processing}
                className="inline-flex w-full items-center justify-center gap-2 border border-edge py-2.5 text-sm font-bold uppercase tracking-wider text-secondary transition hover:border-destructive hover:text-destructive disabled:opacity-50"
              >
                <XCircle size={14} /> Cancel payment
              </button>
            </div>
          )}

          {/* ── MoMo rejected / unreachable — no fake success; cancel and re-order ── */}
          {isMomo && (!payment || payment.source === "simulated") && (
            <>
              <div className="rounded border border-red-800/40 bg-red-950/20 px-4 py-3 text-center">
                <p className="text-sm font-bold text-destructive">MoMo payment unavailable for this order</p>
                <p className="mt-1 text-xs text-muted">
                  The gateway rejected or could not be reached (e.g. amount over 50.000.000₫).
                  Cancel and place the order again with COD.
                </p>
              </div>
              <button
                type="button"
                onClick={() => pay(false)}
                disabled={processing}
                className="inline-flex w-full items-center justify-center gap-2 border border-edge py-2.5 text-sm font-bold uppercase tracking-wider text-secondary transition hover:border-destructive hover:text-destructive disabled:opacity-50"
              >
                <XCircle size={14} /> Cancel payment
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
