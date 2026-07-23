import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { saveToken } from "@/lib/auth";
import { syncGuestDataToAccount } from "../utils/syncGuestDataToAccount";

// Logic for the Google OAuth callback — reads the token from the URL fragment,
// persists it, claims past guest orders + merges the guest cart into the
// account (same as email login/register), cleans the URL and redirects home.
// The component just shows a spinner or the error returned here.
export function useAuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Token is delivered via URL fragment to avoid server-side logging
    const hash = window.location.hash; // e.g. "#token=eyJ..."
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const token = params.get("token");

    if (!token) {
      // The OAuth token lives in the URL fragment, only readable after mount,
      // so this one-shot setState in the effect is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("No token received from Google. Please try again.");
      return;
    }

    // Only trust an internal path (must start with "/", never "//" which
    // browsers treat as protocol-relative) — same rule the backend applies
    // before it round-trips this via Google's state param (see
    // GoogleAuthGuard + auth.controller.ts's googleLoginCallback).
    const redirectTo = params.get("redirect");
    const safeRedirect = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/";

    saveToken(token);

    async function syncThenRedirect() {
      await syncGuestDataToAccount(token!);
      // Clean the fragment from the URL, then redirect back to wherever this
      // OAuth flow started (e.g. /checkout), or home if it didn't say.
      window.history.replaceState(null, "", window.location.pathname);
      router.replace(safeRedirect);
    }

    void syncThenRedirect();
  }, [router]);

  return { error };
}
