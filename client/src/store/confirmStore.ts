import { create } from "zustand";

type ConfirmState = {
  open: boolean;
  title: string;
  description: string;
  resolve: ((value: boolean) => void) | null;
};

type ConfirmActions = {
  request: (description: string, title?: string) => Promise<boolean>;
  handle: (value: boolean) => void;
};

export const useConfirmStore = create<ConfirmState & ConfirmActions>((set, get) => ({
  open: false,
  title: "Are you sure?",
  description: "",
  resolve: null,
  request: (description, title = "Are you sure?") =>
    new Promise<boolean>((resolve) => {
      set({ open: true, title, description, resolve });
    }),
  handle: (value) => {
    get().resolve?.(value);
    set({ open: false, resolve: null });
  },
}));

// Drop-in replacement for window.confirm() — renders as an in-app dialog
// (styled to match the site) instead of the browser's native, unstyleable
// confirm box. Rendered once by <ConfirmDialogHost /> in the root layout.
export function confirmDialog(description: string, title?: string): Promise<boolean> {
  return useConfirmStore.getState().request(description, title);
}
