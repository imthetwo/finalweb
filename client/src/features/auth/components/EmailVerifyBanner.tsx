"use client";
// "use client" vì: useState/useEffect (sessionStorage dismiss state), event handlers

import { Mail, X } from "lucide-react";

import { useEmailVerifyBanner } from "../hooks/useEmailVerifyBanner";

export function EmailVerifyBanner() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { visible, sending, resend, dismiss } = useEmailVerifyBanner();

  if (!visible) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-b border-edge bg-elevated px-4 py-2.5 text-center text-sm text-secondary">
      <span className="inline-flex items-center gap-1.5">
        <Mail size={14} className="text-brand" />
        Please verify your email — check your inbox for a link.
      </span>
      <button
        type="button"
        onClick={resend}
        disabled={sending}
        className="font-bold uppercase tracking-wider text-brand underline decoration-brand/40 hover:decoration-brand disabled:opacity-50"
      >
        {sending ? "Sending…" : "Resend email"}
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-muted transition-colors hover:text-fg"
      >
        <X size={14} />
      </button>
    </div>
  );
}
