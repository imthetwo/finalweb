"use client";
// "use client" vì: useState, useEffect, event handlers (form submit, API calls)

import Link from "next/link";

import { useForgotPasswordForm } from "../hooks/useForgotPasswordForm";

export function ForgotPasswordForm() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { email, setEmail, loading, step, submit } = useForgotPasswordForm();

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <p className="mb-8 text-center text-xs font-black uppercase tracking-[0.3em] text-brand">
          Pecify
        </p>

        {step === "sent" ? (
          /* ── Success state ── */
          <div className="border border-edge bg-elevated p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/40 text-success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-lg font-black uppercase tracking-wide text-fg">Check your email</h1>
            <p className="mt-3 text-body leading-relaxed text-secondary">
              If <span className="text-fg">{email}</span> is registered, we sent a password reset link.
              Check your inbox (and spam folder).
            </p>
            <p className="mt-6 text-xs text-subtle">Link expires in 1 hour.</p>
            <Link
              href="/login"
              className="mt-6 block border border-edge py-2.5 text-center text-sm font-bold uppercase tracking-wider text-secondary transition hover:border-fg hover:text-fg"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <div className="border border-edge bg-elevated">
            <div className="border-b border-edge px-6 py-5">
              <h1 className="text-lg font-black uppercase tracking-wide text-fg">Forgot password</h1>
              <p className="mt-1 text-sm text-muted">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-edge bg-surface px-4 py-2.5 text-sm text-fg outline-none transition-colors focus:border-brand/50 placeholder:text-subtle"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-brand py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-brand/85 disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <div className="border-t border-edge px-6 py-4 text-center">
              <Link
                href="/login"
                className="text-sm font-bold text-muted transition hover:text-fg"
              >
                ← Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
