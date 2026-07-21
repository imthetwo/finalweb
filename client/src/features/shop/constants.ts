export type SearchablePage = { label: string; href: string; keywords: string[] };

// Static site pages the header search can suggest alongside product results —
// otherwise a query like "pc builder" or "track order" only ever searches
// product name/brand/category and finds nothing, even though those are real
// pages on the site. Kept to genuine standalone destinations (not
// flow-only pages like checkout/order-success/reset-password).
export const SEARCHABLE_PAGES: SearchablePage[] = [
  { label: "PC Builder", href: "/custom-lab", keywords: ["pc builder", "build", "custom pc", "compatibility", "custom lab"] },
  { label: "Track Order", href: "/track-order", keywords: ["track order", "order status", "track", "delivery"] },
  { label: "My Account", href: "/account", keywords: ["account", "profile", "settings"] },
  { label: "My Orders", href: "/account?tab=orders", keywords: ["orders", "order history", "my orders"] },
  { label: "Wishlist", href: "/account?tab=wishlist", keywords: ["wishlist", "saved", "favorites"] },
  { label: "Shopping Cart", href: "/cart", keywords: ["cart", "basket", "shopping cart"] },
  { label: "Support", href: "/support", keywords: ["support", "contact", "help", "contact us"] },
  { label: "Warranty Policy", href: "/warranty", keywords: ["warranty", "return policy"] },
  { label: "About Us", href: "/about", keywords: ["about", "about us", "company"] },
  { label: "Privacy Policy", href: "/privacy", keywords: ["privacy"] },
  { label: "Terms of Service", href: "/terms", keywords: ["terms", "tos", "terms of service"] },
];
