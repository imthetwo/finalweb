"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";

type Step = "form" | "sent";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStep("sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <p className="mb-8 text-center text-[11px] font-black uppercase tracking-[0.3em] text-brand">
          Pecify
        </p>

        {step === "sent" ? (
          /* ── Success state ── */
          <div className="border border-edge bg-elevated p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/40 text-emerald-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-lg font-black uppercase tracking-wide text-fg">Check your email</h1>
            <p className="mt-3 text-[13px] leading-relaxed text-secondary">
              If <span className="text-fg">{email}</span> is registered, we sent a password reset link.
              Check your inbox (and spam folder).
            </p>
            <p className="mt-6 text-[11px] text-subtle">Link expires in 1 hour.</p>
            <Link
              href="/login"
              className="mt-6 block border border-edge py-2.5 text-center text-[12px] font-bold uppercase tracking-wider text-secondary transition hover:border-white hover:text-fg"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <div className="border border-edge bg-elevated">
            <div className="border-b border-edge px-6 py-5">
              <h1 className="text-lg font-black uppercase tracking-wide text-fg">Forgot password</h1>
              <p className="mt-1 text-[12px] text-muted">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">
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
                className="w-full bg-brand py-3 text-[12px] font-black uppercase tracking-wider text-black transition hover:bg-brand/85 disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <div className="border-t border-edge px-6 py-4 text-center">
              <Link
                href="/login"
                className="text-[12px] font-bold text-muted transition hover:text-fg"
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
