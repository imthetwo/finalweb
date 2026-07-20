import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { confirmNewsletter } from "@/lib/api/newsletter";

type Status = "loading" | "success" | "error";

// Logic for the newsletter double opt-in confirmation screen — reads the
// token from the URL and confirms it once on mount. The component only
// renders based on the resulting status.
export function useNewsletterConfirm() {
  const token = useSearchParams().get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Missing confirmation token.");
      return;
    }
    confirmNewsletter(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Confirmation failed.");
      });
  }, [token]);

  return { status, error };
}
