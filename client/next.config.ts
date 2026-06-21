import type { NextConfig } from "next";

const apiHost =
  process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "") ?? "localhost:3001";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ── Development placeholders ──────────────────────────────
      { protocol: "https", hostname: "placehold.co" },

      // ── Local media server ────────────────────────────────────
      { protocol: "http",  hostname: "localhost",          port: "3001", pathname: "/media/**" },
      { protocol: "http",  hostname: apiHost.split(":")[0], pathname: "/media/**" },

      // ── Cloudinary CDN (production images) ───────────────────
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
