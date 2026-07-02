"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-base px-4 text-center text-fg">
      <AlertTriangle size={52} className="text-destructive" />
      <h1 className="mt-6 text-2xl font-black uppercase tracking-tight text-fg">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-sm text-body text-secondary">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-brand px-6 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-brand/85"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-edge px-6 py-3 text-sm font-bold uppercase tracking-wider text-secondary transition hover:border-fg hover:text-fg"
        >
          Go home
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-2xs text-subtle">
          Error ID: {error.digest}
        </p>
      )}
    </main>
  );
}
