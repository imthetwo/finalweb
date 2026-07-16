"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { usePromoBar } from "./hooks/usePromoBar";

export default function PromoBar() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { idx, promos, next, prev } = usePromoBar();

  return (
    <div className="h-9 w-full select-none bg-elevated">
      <div
        className="mx-auto flex h-full w-full items-center justify-center px-4 md:px-6"
        style={{ maxWidth: "1920px" }}
      >
        {/* Left — empty spacer on mobile, links on desktop */}
        <div className="hidden flex-1 md:flex" />

        {/* Centre — rotating promo */}
        <div className="flex flex-none items-center justify-center gap-2">
          <button
            type="button"
            onClick={prev}
            className="p-1 text-subtle transition-colors hover:text-fg"
            aria-label="Previous promotion"
          >
            <ChevronLeft size={14} />
          </button>

          <div
            className="relative h-5 w-64 overflow-hidden sm:w-96 lg:w-140 [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
            aria-live="polite"
          >
            <div
              className="flex h-full flex-nowrap transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${idx * 100}%)` }}
            >
              {promos.map((p, i) => (
                <div
                  key={i}
                  className="flex h-full w-full shrink-0 items-center justify-center gap-2 px-2"
                >
                  <span className="truncate text-xs font-medium uppercase tracking-wide text-fg">
                    {p.text}
                  </span>
                  <Link
                    href={p.href}
                    className="shrink-0 text-xs font-black text-brand hover:underline"
                  >
                    {p.action} →
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={next}
            className="p-1 text-subtle transition-colors hover:text-fg"
            aria-label="Next promotion"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Right — empty spacer to keep promo centered */}
        <div className="hidden flex-1 md:flex" />
      </div>
    </div>
  );
}
