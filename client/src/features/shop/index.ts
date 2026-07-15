// ── Public API (gatekeeper) for the `shop` feature ──────────────────────────
// Import shop's surface from here, not from internal subfolders.
// NOTE: the server-only data loader (`data/getShopPage`) is intentionally kept
// internal so this barrel stays safe to import from client components.
export { default as ShopBrowser } from "./ShopBrowser";
export { ShopLoadingSkeleton } from "./components/ShopLoadingSkeleton";
export { useSearch } from "./hooks/useSearch";
