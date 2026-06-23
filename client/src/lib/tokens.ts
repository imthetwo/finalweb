/**
 *
 * Tailwind class mapping (dùng class này thay hardcode hex):
 *   #00ffff  → bg-brand / text-brand / border-brand
 *   #0a0a0a  → bg-base
 *   #0d0d0d  → bg-surface
 *   #111111  → bg-elevated
 *   #141414  → bg-overlay
 *   zinc-400 → text-secondary
 *   zinc-500 → text-muted
 *   zinc-600 → text-subtle
 */

export const colors = {
  // ── Brand ─────────────────────────────────────────────────
  brand: "#00ffff", // bg-brand / text-brand
  brandHover: "#00cccc", // hover:bg-brand-hover
  brandDim: "rgba(0,255,255,0.15)", // bg-brand-dim
  brandFg: "#000000", // text on brand bg

  // ── Backgrounds ───────────────────────────────────────────
  base: "#0a0a0a", // bg-base    — trang gốc
  surface: "#0d0d0d", // bg-surface — sidebar, panels
  elevated: "#111111", // bg-elevated — cards, product tiles
  overlay: "#141414", // bg-overlay  — modals, dropdowns

  // ── Borders ───────────────────────────────────────────────
  edge: "rgba(255,255,255,0.08)", // border-edge   — standard
  edgeFaint: "rgba(255,255,255,0.04)", // border-edge-faint — dividers
  edgeBrand: "rgba(0,255,255,0.3)", // border-edge-brand — cyan border

  // ── Text ──────────────────────────────────────────────────
  fg: "#ffffff", // text-fg        — primary text
  secondary: "#a1a1aa", // text-secondary — zinc-400
  muted: "#71717a", // text-muted     — zinc-500
  subtle: "#52525b", // text-subtle    — zinc-600

  // ── Status ─────────────────────────────────────────────────
  success: "#34d399", // emerald-400
  error: "#ef4444", // red-500
  warning: "#fbbf24", // amber-400
} as const;

/** Tailwind class shortcuts — dùng thay hardcode */
export const tw = {
  // Backgrounds
  bgBase: "bg-base",
  bgSurface: "bg-surface",
  bgElevated: "bg-elevated",
  bgOverlay: "bg-overlay",

  // Brand
  bgBrand: "bg-brand",
  textBrand: "text-brand",
  borderBrand: "border-brand",

  // Text
  textFg: "text-fg",
  textSecondary: "text-secondary",
  textMuted: "text-muted",
  textSubtle: "text-subtle",

  // Borders
  borderEdge: "border-edge",
} as const;

export type ColorKey = keyof typeof colors;
