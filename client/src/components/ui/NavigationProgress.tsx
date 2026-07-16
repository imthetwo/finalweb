"use client";

import { Suspense } from "react";

import { useNavigationProgress } from "@/hooks/useNavigationProgress";

function ProgressBar() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { progress, visible } = useNavigationProgress();

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
