"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "fill" | "onLoad" | "onError">;

// Fill-mode image with a shimmer placeholder shown until the real image
// loads — reuses the same --gradient-shimmer-brand / animate-shimmer tokens
// as ShopLoadingSkeleton so the "waiting" state matches the site's own
// full-page loading style instead of introducing a new one. Falls back to a
// static "image unavailable" state on error instead of shimmering forever.
export function ProductImage({ className, ...props }: Props) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  if (status === "error") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-elevated text-subtle">
        <ImageOff size={28} />
        <span className="text-2xs uppercase tracking-widest">Image unavailable</span>
      </div>
    );
  }

  return (
    <>
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 animate-shimmer bg-size-[200%_100%]" style={{ backgroundImage: "var(--gradient-shimmer-brand)" }}>
          <span className="text-2xs font-bold uppercase tracking-widest text-fg/70">Loading image…</span>
        </div>
      )}
      <Image
        {...props}
        fill
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={cn("transition-opacity duration-300", status === "loaded" ? "opacity-100" : "opacity-0", className)}
      />
    </>
  );
}
