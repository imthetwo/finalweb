"use client";
// "use client" because: useEffect (confirm on mount), reads URL token

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { useGuestCheckoutConfirmPage } from "../hooks/useGuestCheckoutConfirmPage";

export function GuestCheckoutConfirmPage() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { status } = useGuestCheckoutConfirmPage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center text-xs font-black uppercase tracking-[0.3em] text-brand">
          Pecify
        </p>

        <div className="border border-edge bg-elevated p-8 text-center">
          {status === "confirming" && (
            <>
              <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full bg-brand/10" />
              <h1 className="text-lg font-black uppercase tracking-wide text-fg">Confirming…</h1>
              <p className="mt-3 text-body text-secondary">Placing your order.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/40 text-success">
                <CheckCircle2 size={26} />
              </div>
              <h1 className="text-lg font-black uppercase tracking-wide text-fg">Order confirmed!</h1>
              <p className="mt-3 text-body text-secondary">Redirecting you now…</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-950/40 text-destructive">
                <XCircle size={26} />
              </div>
              <h1 className="text-lg font-black uppercase tracking-wide text-fg">Link expired or invalid</h1>
              <p className="mt-3 text-body text-secondary">
                This confirmation link is no longer valid. Go back to checkout and submit your order again to get a new one.
              </p>
              <Link
                href="/checkout"
                className="mt-6 block bg-brand py-2.5 text-center text-sm font-black uppercase tracking-wider text-black transition hover:bg-brand/85"
              >
                Back to checkout
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
