import { useState } from "react";

// Tracks an <img>/<Image>'s loading/loaded/error state via onLoad/onError handlers.
export function useImageLoadState() {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const onLoad = () => setStatus("loaded");
  const onError = () => setStatus("error");
  return { status, onLoad, onError };
}
