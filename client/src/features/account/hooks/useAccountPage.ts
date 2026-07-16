import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { fetchProfile } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useAuthState } from "@/hooks/useAuthState";
import type { UserProfile } from "@/types/api";

// The only tabs AccountPage actually renders — anything else (e.g. a future
// "builds" tab requested via ?tab=builds before that feature exists) falls
// back to Profile instead of silently rendering a blank tab area.
const VALID_TABS = ["profile", "orders", "wishlist", "addresses"] as const;

// Data/logic for the account page — loads the profile, redirects unauthenticated
// visitors, and resolves the initial tab from the URL. The component only renders.
export function useAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuthState();

  const requestedTab = searchParams.get("tab");
  const initialTab = (VALID_TABS as readonly string[]).includes(requestedTab ?? "")
    ? requestedTab!
    : "profile";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    fetchProfile()
      .then(setProfile)
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  return { profile, setProfile, loading, initialTab, logout };
}
