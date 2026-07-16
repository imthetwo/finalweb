import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import { useAuthState } from "@/hooks/useAuthState";

const DISMISS_KEY = "email-verify-banner-dismissed";

// Non-blocking reminder — shows once per browser tab session (dismissed
// state lives in sessionStorage, not localStorage) for a logged-in user whose
// email isn't verified yet. Never gates anything; just a nudge + resend.
export function useEmailVerifyBanner() {
  const { user, loaded } = useAuthState();
  const [dismissed, setDismissed] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function resend() {
    setSending(true);
    try {
      const res = await apiFetch<{ ok: boolean; alreadyVerified: boolean }>("/auth/resend-verification", {
        method: "POST",
      });
      toast.success(res.alreadyVerified ? "Your email is already verified" : "Verification email sent — check your inbox");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend verification email");
    } finally {
      setSending(false);
    }
  }

  const visible = loaded && !!user && !user.isEmailVerified && !dismissed;

  return { visible, sending, resend, dismiss };
}
