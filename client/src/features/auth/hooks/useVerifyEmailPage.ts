import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { verifyEmail } from "@/lib/api/auth";
import { saveToken } from "@/lib/auth";

type Status = "verifying" | "success" | "error";

// Logic for the /verify-email screen — grabs the token from the URL and
// silently confirms it with the backend on mount. The component only renders
// based on the resulting status.
export function useVerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then((res) => {
        // Reissues the JWT so isEmailVerified updates immediately, without
        // requiring the user to log out and back in.
        saveToken(res.access_token);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return { status };
}
