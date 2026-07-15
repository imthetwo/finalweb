import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export function CartIcon({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      className="relative flex items-center justify-center text-fg transition-colors hover:text-brand"
      aria-label={`View cart – ${count} items`}
    >
      <ShoppingCart size={22} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand" />
      )}
    </Link>
  );
}
