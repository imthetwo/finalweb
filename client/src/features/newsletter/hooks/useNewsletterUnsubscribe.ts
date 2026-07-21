import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { unsubscribeNewsletter } from "@/lib/api/newsletter";

type Status = "loading" | "success" | "error";

// Logic for the newsletter unsubscribe screen — reads the token from the URL
// and unsubscribes once on mount. The component only renders based on the
// resulting status.
export function useNewsletterUnsubscribe() {
  const token = useSearchParams().get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Missing unsubscribe token.");
      return;
    }
    unsubscribeNewsletter(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unsubscribe failed.");
      });
  }, [token]);

  return { status, error };
}
