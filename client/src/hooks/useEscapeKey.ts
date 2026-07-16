import { useEffect } from "react";

// Calls onEscape when the Escape key is pressed — used by modals/overlays to close on Esc.
export function useEscapeKey(onEscape: () => void) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onEscape();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onEscape]);
}
