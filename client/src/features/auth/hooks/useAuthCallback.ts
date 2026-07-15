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

    saveToken(token);

    async function syncThenRedirect() {
      await syncGuestDataToAccount(token!);
      // Clean the fragment from the URL, then redirect home
      window.history.replaceState(null, "", window.location.pathname);
      router.replace("/");
    }

    void syncThenRedirect();
  }, [router]);

  return { error };
}
