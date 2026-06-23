"use client";
// "use client" vì: useState, useEffect, useRouter — OAuth callback xử lý hash fragment

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveToken } from "@/lib/auth";

export function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Token is delivered via URL fragment to avoid server-side logging
    const hash = window.location.hash; // e.g. "#token=eyJ..."
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const token = params.get("token");

    if (!token) {
      setError("No token received from Google. Please try again.");
      return;
    }

    saveToken(token);

    // Clean the fragment from the URL, then redirect home
    window.history.replaceState(null, "", window.location.pathname);
    router.replace("/");
  }, [router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-4 text-fg">
        <div className="w-full max-w-sm border border-red-800/40 bg-red-950/20 p-6 text-center">
          <p className="text-sm font-bold text-red-400">{error}</p>
          <a
            href="/login"
            className="mt-4 inline-block text-[12px] text-secondary underline hover:text-fg"
          >
            Back to login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-base text-fg">
      <div className="flex flex-col items-center gap-4">
        <svg
          className="h-8 w-8 animate-spin text-brand"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <p className="text-sm text-secondary">Completing Google sign-in…</p>
      </div>
    </main>
  );
}
