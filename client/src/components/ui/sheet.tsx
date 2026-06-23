"use client";

import { type Dispatch, type MouseEvent, type ReactElement, type ReactNode, type SetStateAction, cloneElement, createContext, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type SheetContextValue = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = useContext(SheetContext);

  if (!context) {
    throw new Error("Sheet components must be used within <Sheet>.");
  }

  return context;
}

type SheetProps = {
  children: ReactNode;
};

export function Sheet({ children }: SheetProps) {
  const [open, setOpen] = useState(false);

  const value = useMemo(() => ({ open, setOpen }), [open]);

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

type ClickableProps = { onClick?: (event: MouseEvent<HTMLElement>) => void };

type SheetTriggerProps = {
  children: ReactElement<ClickableProps>;
};

export function SheetTrigger({ children }: SheetTriggerProps) {
  const { open, setOpen } = useSheetContext();

  return cloneElement(children, {
    onClick: (event: MouseEvent<HTMLElement>) => {
      children.props.onClick?.(event);
      setOpen(!open);
    },
  });
}

type SheetCloseProps = {
  children: ReactElement<ClickableProps>;
};

export function SheetClose({ children }: SheetCloseProps) {
  const { setOpen } = useSheetContext();

  return cloneElement(children, {
    onClick: (event: MouseEvent<HTMLElement>) => {
      children.props.onClick?.(event);
      setOpen(false);
    },
  });
}

type SheetContentProps = {
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
};

export function SheetContent({ children, side = "right", className }: SheetContentProps) {
  const { open, setOpen } = useSheetContext();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const sheet = (
    <div className="fixed inset-0" style={{ zIndex: 60 }}>
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div
        className={cn(
          "absolute top-0 h-full w-[min(88vw,22rem)] bg-base border-zinc-800 shadow-2xl",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
          className,
        )}
      >
        <div className="flex h-full flex-col">{children}</div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

export function SheetHeader({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">{children}</div>;
}

export function SheetTitle({ children }: { children: ReactNode }) {
  return <div className="text-sm font-bold uppercase tracking-[0.2em] text-white">{children}</div>;
}

export function SheetDescription({ children }: { children: ReactNode }) {
  return <div className="text-sm text-zinc-400">{children}</div>;
}

export function SheetBody({ children }: { children: ReactNode }) {
  return <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>;
}

export function SheetFooter({ children }: { children: ReactNode }) {
  return <div className="mt-auto border-t border-zinc-800 px-5 py-4">{children}</div>;
}

export function SheetXButton() {
  const { setOpen } = useSheetContext();

  return (
    <button
      type="button"
      aria-label="Close menu"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 text-zinc-300 transition-colors hover:text-white"
      onClick={() => setOpen(false)}
    >
      <X className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}