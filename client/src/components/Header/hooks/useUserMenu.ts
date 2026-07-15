import { useEffect, useRef, useState } from "react";

import { useAuthState } from "@/hooks/useAuthState";

type AuthDialog = "none" | "login" | "register";

// Data/logic for the header user menu — auth state, dropdown and auth-dialog
// open state, and close-on-outside-click. The component only renders.
export function useUserMenu() {
  const { user, loaded, logout } = useAuthState();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<AuthDialog>("none");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return { user, loaded, logout, open, setOpen, dialog, setDialog, ref };
}
