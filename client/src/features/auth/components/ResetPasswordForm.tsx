"use client";
// "use client" vì: useState, useEffect, event handlers (form submit, API calls)

import Link from "next/link";

import { useResetPasswordForm } from "../hooks/useResetPasswordForm";

export function ResetPasswordForm() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { token, password, setPassword, confirm, setConfirm, loading, step, submit } =
    useResetPasswordForm();

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-4 py-16">
        <div className="w-full max-w-sm border border-edge bg-elevated p-8 text-center">
          <p className="text-sm text-destructive">
            Invalid or missing reset token.
          </p>
          <Link
            href="/forgot-password"
            className="mt-4 block text-sm text-brand hover:underline"
          >
            Request a new link →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center text-xs font-black uppercase tracking-[0.3em] text-brand">
          Pecify
        </p>

        {step === "done" ? (
          <div className="border border-edge bg-elevated p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/40 text-success">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-lg font-black uppercase tracking-wide text-fg">
              Password updated!
            </h1>
            <p className="mt-3 text-body text-secondary">
              Your password has been reset successfully. Redirecting to sign in…
            </p>
            <Link
              href="/login"
              className="mt-6 block border border-edge py-2.5 text-center text-sm font-bold uppercase tracking-wider text-secondary transition hover:border-fg hover:text-fg"
            >
              Sign in now
            </Link>
          </div>
        ) : (
          <div className="border border-edge bg-elevated">
            <div className="border-b border-edge px-6 py-5">
              <h1 className="text-lg font-black uppercase tracking-wide text-fg">
                Set new password
              </h1>
              <p className="mt-1 text-sm text-muted">
                Must be at least 6 characters.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
                  New password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-edge bg-surface px-4 py-2.5 text-sm text-fg outline-none transition-colors focus:border-brand/50 placeholder:text-subtle"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-edge bg-surface px-4 py-2.5 text-sm text-fg outline-none transition-colors focus:border-brand/50 placeholder:text-subtle"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full bg-brand py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-brand/85 disabled:opacity-50"
              >
                {loading ? "Saving…" : "Set new password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
