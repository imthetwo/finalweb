"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

function ProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      // Navigation completed → finish bar
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
      prevPath.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
      if (href === pathname) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      setProgress(10);
      setVisible(true);

      let p = 10;
      intervalRef.current = setInterval(() => {
        const step = Math.random() * 12 + 3;
        p = Math.min(p + step, 85);
        setProgress(p);
        if (p >= 85) clearInterval(intervalRef.current!);
      }, 180);
    }

    document.addEventListener("click", onLinkClick);
    return () => {
      document.removeEventListener("click", onLinkClick);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        height: "2px",
        width: `${progress}%`,
        opacity: visible ? 1 : 0,
        transition: "width 0.18s ease-out, opacity 0.3s ease",
        background: "linear-gradient(90deg, var(--primary), var(--primary-hover))",
        boxShadow: "var(--glow-xs), 0 0 4px var(--primary)",
        pointerEvents: "none",
      }}
    />
  );
}

export default function NavigationProgress() {
  return (
    <Suspense>
      <ProgressBar />
    </Suspense>
  );
}
