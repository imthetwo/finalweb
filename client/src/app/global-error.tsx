"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: "#0a0a0a",
          color: "#ffffff",
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "1rem",
          fontFamily: "ui-monospace, monospace",
          margin: 0,
        }}
      >
        <p
          style={{
            fontSize: "4rem",
            fontWeight: 900,
            color: "rgba(239,68,68,0.2)",
            lineHeight: 1,
          }}
        >
          500
        </p>
        <h1
          style={{
            marginTop: "1rem",
            fontSize: "1.25rem",
            fontWeight: 900,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Critical Error
        </h1>
        <p
          style={{
            marginTop: "0.75rem",
            color: "#71717a",
            fontSize: "0.875rem",
            maxWidth: "28rem",
          }}
        >
          {error.message || "The application encountered a critical error."}
        </p>
        {error.digest && (
          <p
            style={{
              marginTop: "0.5rem",
              color: "#52525b",
              fontSize: "0.7rem",
            }}
          >
            ID: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "2rem",
            background: "#00ffff",
            color: "#000",
            padding: "0.75rem 2.5rem",
            fontWeight: 900,
            fontSize: "0.8rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: "none",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
