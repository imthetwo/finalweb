import { useState } from "react";

import { useCartCount } from "@/hooks/useCartCount";
import { useAuthState } from "@/hooks/useAuthState";
import type { AuthDialog } from "../types";

// Data/logic for the main nav — desktop search-bar toggle, cart count, auth
// state, and the mobile sheet's login/register dialog switch (same "none" |
// "login" | "register" pattern UserMenu.tsx uses for desktop) used by both
// the mobile sheet and desktop bar. The component only renders.
export function useMainNav() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [dialog, setDialog] = useState<AuthDialog>("none");
  const cartCount = useCartCount();
  const { user, loaded } = useAuthState();

  return { searchOpen, setSearchOpen, dialog, setDialog, cartCount, user, loaded };
}
