import { useState } from "react";

import { useCartCount } from "@/hooks/useCartCount";
import { useAuthState } from "@/hooks/useAuthState";
import type { AuthDialog } from "../types";

// Data/logic for the main nav — desktop search-bar toggle, cart count, auth
// state, and the mobile sheet's login/register dialog switch (same "none" |
// "login" | "register" pattern UserMenu.tsx uses for desktop) used by both
// the mobile sheet and desktop bar. The component only renders.
//
// Reading ?login=/?register=/?redirect= (to auto-open a dialog when /login or
// /register — see their page.tsx — bounce back here) needs useSearchParams(),
// which requires its own <Suspense> boundary or every page in the app fails
// to prerender. That's split out into the AuthDialogFromQuery component
// (MainNav.tsx) instead of living here, so this hook stays usable outside
// a Suspense boundary too.
export function useMainNav() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [dialog, setDialog] = useState<AuthDialog>("none");
  const cartCount = useCartCount();
  const { user, loaded } = useAuthState();

  return { searchOpen, setSearchOpen, dialog, setDialog, cartCount, user, loaded };
}
