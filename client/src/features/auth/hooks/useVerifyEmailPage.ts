import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { verifyEmail } from "@/lib/api/auth";
import { saveToken } from "@/lib/auth";
import { syncGuestDataToAccount } from "../utils/syncGuestDataToAccount";

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
      .then(async (res) => {
        // This is also this account's first real session if they just
        // registered — same as email login/Google — so claim past guest
        // orders + merge the guest cart here too, or a guest who registered
        // mid-session loses both. Done before saveToken so the navbar (which
        // reacts to the store update inside saveToken) doesn't flip to
        // "logged in" a beat before this card finishes showing "verified".
        await syncGuestDataToAccount(res.access_token);
        saveToken(res.access_token);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return { status };
}
