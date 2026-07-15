"use client";

import { Toaster as Sonner } from "sonner";

// App-wide toast styling — matches the Pecify design system (globals.css):
// sharp corners, elevated dark panels with 1px edge borders, cyan brand accent,
// uppercase black action buttons with the brand glow. Each toast type gets a
// colored left accent. `expand` + wider panel + larger type = calm, readable.
export function Toaster() {
  return (
    <Sonner
      position="top-right"
      closeButton
      expand
      gap={12}
      duration={4000}
      style={{ "--width": "420px" } as React.CSSProperties}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-none !border !border-edge !bg-elevated !text-fg !p-5 !gap-3 !items-start !shadow-[0_16px_56px_rgba(0,0,0,0.75)] [&_svg]:!h-5 [&_svg]:!w-5",
          title: "!text-base !font-bold !text-fg !leading-snug",
          description: "!text-body !text-muted !mt-1 !leading-relaxed",
          closeButton:
            "!rounded-none !border-edge !bg-surface !text-muted hover:!text-fg !transition-colors",
          actionButton:
            "!rounded-none !bg-brand !text-black !h-9 !px-4 !text-xs !font-black !uppercase !tracking-wider !transition-all hover:!bg-brand/85 hover:!shadow-glow-btn",
          cancelButton:
            "!rounded-none !border !border-edge !bg-surface !text-secondary !h-9 !px-4 !text-xs !font-bold !uppercase !transition-colors hover:!text-fg",
          success: "!border-l-2 !border-l-success [&_svg]:!text-success",
          error: "!border-l-2 !border-l-destructive [&_svg]:!text-destructive",
          info: "!border-l-2 !border-l-brand [&_svg]:!text-brand",
          warning: "!border-l-2 !border-l-warning [&_svg]:!text-warning",
        },
      }}
    />
  );
}
