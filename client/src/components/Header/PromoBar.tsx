"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { fetchPromotions } from "@/lib/api";

const FALLBACK_PROMOS = [
  {
    text: "FREE SHIPPING ON ORDERS OVER 2,000,000 VND",
    action: "SHOP NOW",
    href: "/components/processors",
  },
  {
    text: "RTX 5080 & INTEL CORE ULTRA 200 — NOW IN STOCK",
    action: "DISCOVER",
    href: "/components/graphics-cards",
  },
  {
    text: "CUSTOM PC BUILDER: CONFIGURE YOUR DREAM RIG",
    action: "BUILD NOW",
    href: "/custom-lab",
  },
  {
    text: "2-YEAR WARRANTY ON ALL PRODUCTS",
    action: "LEARN MORE",
    href: "/warranty",
  },
];

export default function PromoBar() {
  const [idx, setIdx] = useState(0);
  const [promos, setPromos] = useState(FALLBACK_PROMOS);

  useEffect(() => {
    fetchPromotions()
      .then((data) => {
        if (data.length > 0) {
          setPromos(
            data.map((p) => ({
              text: p.title,
              action: p.actionLabel || "VIEW",
              href: p.href || "/",
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  const next = useCallback(() => setIdx((i) => (i + 1) % promos.length), [promos.length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + promos.length) % promos.length), [promos.length]);

  useEffect(() => {
    setIdx(0);
  }, [promos]);

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next]);

  return (
    <div className="h-9 w-full select-none border-b border-edge bg-elevated">
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
                  <span className="truncate text-[11px] font-medium uppercase tracking-wide text-fg">
                    {p.text}
                  </span>
                  <Link
                    href={p.href}
                    className="shrink-0 text-[11px] font-black text-brand hover:underline"
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
