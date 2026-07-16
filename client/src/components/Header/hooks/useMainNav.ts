import { useState } from "react";

import { useCartCount } from "@/hooks/useCartCount";
import { useAuthState } from "@/hooks/useAuthState";

// Data/logic for the main nav — desktop search-bar toggle, cart count, and
// auth state used by both the mobile sheet and desktop bar. The component only renders.
export function useMainNav() {
  const [searchOpen, setSearchOpen] = useState(false);
  const cartCount = useCartCount();
  const { user, loaded } = useAuthState();

  return { searchOpen, setSearchOpen, cartCount, user, loaded };
}
