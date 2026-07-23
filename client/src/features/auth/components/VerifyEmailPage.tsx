"use client";
// "use client" because: useState/useEffect (verify on mount), reads URL token

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { useVerifyEmailPage } from "../hooks/useVerifyEmailPage";

export function VerifyEmailPage() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { status } = useVerifyEmailPage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="border border-edge bg-elevated p-8 text-center">
          {status === "verifying" && (
            <>
              <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full bg-brand/10" />
              <h1 className="text-lg font-black uppercase tracking-wide text-fg">Verifying…</h1>
              <p className="mt-3 text-body text-secondary">Confirming your email address.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/40 text-success">
                <CheckCircle2 size={26} />
              </div>
              <h1 className="text-lg font-black uppercase tracking-wide text-fg">Email verified!</h1>
              <p className="mt-3 text-body text-secondary">
                Your account is now verified. You can start shopping right away.
              </p>
              <Link
                href="/"
                className="mt-6 block bg-brand py-2.5 text-center text-sm font-black uppercase tracking-wider text-black transition hover:bg-brand/85"
              >
                Continue shopping
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
                This verification link is no longer valid. Sign in and request a new one from your account.
              </p>
              <Link
                href="/login"
                className="mt-6 block border border-edge py-2.5 text-center text-sm font-bold uppercase tracking-wider text-secondary transition hover:border-fg hover:text-fg"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
