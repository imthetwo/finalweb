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
        <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-black text-black">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
