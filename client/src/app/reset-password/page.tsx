"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";

type Step = "form" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setStep("done");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-4 py-16">
        <div className="w-full max-w-sm border border-edge bg-elevated p-8 text-center">
          <p className="text-sm text-red-400">Invalid or missing reset token.</p>
          <Link href="/forgot-password" className="mt-4 block text-[12px] text-brand hover:underline">
            Request a new link →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center text-[11px] font-black uppercase tracking-[0.3em] text-brand">
          Pecify
        </p>

        {step === "done" ? (
          <div className="border border-edge bg-elevated p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/40 text-emerald-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-lg font-black uppercase tracking-wide text-white">Password updated!</h1>
            <p className="mt-3 text-[13px] text-secondary">
              Your password has been reset successfully. Redirecting to sign in…
            </p>
            <Link
              href="/login"
              className="mt-6 block border border-zinc-700 py-2.5 text-center text-[12px] font-bold uppercase tracking-wider text-zinc-300 transition hover:border-white hover:text-white"
            >
              Sign in now
            </Link>
          </div>
        ) : (
          <div className="border border-edge bg-elevated">
            <div className="border-b border-edge px-6 py-5">
              <h1 className="text-lg font-black uppercase tracking-wide text-white">Set new password</h1>
              <p className="mt-1 text-[12px] text-muted">Must be at least 6 characters.</p>
            </div>

            <form onSubmit={submit} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">
                  New password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-brand/50 placeholder:text-subtle"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-brand/50 placeholder:text-subtle"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full bg-brand py-3 text-[12px] font-black uppercase tracking-wider text-black transition hover:bg-brand/85 disabled:opacity-50"
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
