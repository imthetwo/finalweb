import { useCallback, useEffect, useState } from "react";

import { fetchPromotions } from "@/lib/api";
import type { PromoItem } from "../types";

const FALLBACK_PROMOS: PromoItem[] = [
  {
    text: "FREE SHIPPING ON ORDERS OVER 2.000.000₫",
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

// Data/logic for the header promo bar — fetches real promotions (falling back
// to static copy), and rotates through them on a timer. The component only renders.
export function usePromoBar() {
  const [idx, setIdx] = useState(0);
  const [promos, setPromos] = useState<PromoItem[]>(FALLBACK_PROMOS);

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

  return { idx, promos, next, prev };
}
