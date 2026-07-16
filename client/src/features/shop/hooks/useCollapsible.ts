import { useState } from "react";

// Open/closed state for a collapsible filter section. The component only renders based on this.
export function useCollapsible(defaultOpen = false) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => setOpen((v) => !v);
  return { open, toggle };
}
