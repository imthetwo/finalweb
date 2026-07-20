"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { useConfirmStore } from "@/store/confirmStore";

// Renders the single, app-wide confirm dialog driven by confirmStore/
// confirmDialog() — mounted once in the root layout. Replaces window.confirm()
// so confirmations match the site's dark theme instead of the browser's own.
export function ConfirmDialogHost() {
  const open = useConfirmStore((s) => s.open);
  const title = useConfirmStore((s) => s.title);
  const description = useConfirmStore((s) => s.description);
  const handle = useConfirmStore((s) => s.handle);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handle(false); }}>
      <DialogContent className="max-w-sm rounded-none">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 px-6 pb-6">
          <button
            type="button"
            onClick={() => handle(false)}
            className="border border-edge bg-surface px-4 py-2 text-xs font-bold uppercase tracking-wider text-secondary transition-colors hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handle(true)}
            className="bg-brand px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-brand/85 hover:shadow-glow-btn"
          >
            Confirm
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
