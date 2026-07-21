"use client";
// "use client" because: useState/useEffect (unsubscribe on mount), reads URL token

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { useNewsletterUnsubscribe } from "../hooks/useNewsletterUnsubscribe";

export function NewsletterUnsubscribe() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { status, error } = useNewsletterUnsubscribe();

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center text-xs font-black uppercase tracking-[0.3em] text-brand">
          Pecify
        </p>

        <div className="border border-edge bg-elevated p-8 text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full bg-brand/10" />
              <h1 className="text-lg font-black uppercase tracking-wide text-fg">Unsubscribing…</h1>
              <p className="mt-3 text-body text-secondary">One moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/40 text-success">
                <CheckCircle2 size={26} />
              </div>
              <h1 className="text-lg font-black uppercase tracking-wide text-fg">You&apos;re unsubscribed</h1>
              <p className="mt-3 text-body text-secondary">
                You won&apos;t receive any more Pecify newsletter emails. You can re-subscribe any time from the store.
              </p>
              <Link
                href="/"
                className="mt-6 block bg-brand py-2.5 text-center text-sm font-black uppercase tracking-wider text-black transition hover:bg-brand/85"
              >
                Back to store
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-950/40 text-destructive">
                <XCircle size={26} />
              </div>
              <h1 className="text-lg font-black uppercase tracking-wide text-fg">Link expired or invalid</h1>
              <p className="mt-3 text-body text-secondary">
                {error ?? "This unsubscribe link is no longer valid."}
              </p>
              <Link
                href="/"
                className="mt-6 block border border-edge py-2.5 text-center text-sm font-bold uppercase tracking-wider text-secondary transition hover:border-fg hover:text-fg"
              >
                Back to store
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
