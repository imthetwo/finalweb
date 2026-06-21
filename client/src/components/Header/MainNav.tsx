"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { fetchProducts, type ProductListItem } from "@/lib/api";
import { formatVnd } from "@/lib/format";

import CategoryMenu from "@/components/Header/CategoryMenu";
import Logo from "@/components/Header/Logo";
import { UserMenu } from "@/components/Header/UserMenu";
import { useCartCount } from "@/hooks/useCartCount";
import { useAuthState } from "@/hooks/useAuthState";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetXButton,
} from "@/components/ui/sheet";
import { LoginOverlay } from "@/features/auth/LoginOverlay";

const MOBILE_LINKS = [
  { label: "Laptops", href: "/laptops" },
  { label: "Prebuilt PCs", href: "/pcs" },
  { label: "Components", href: "/components/processors" },
  { label: "Gaming Gear", href: "/gaming-gear/input-devices/mechanical-keyboards" },
  { label: "Gaming Furniture", href: "/gaming-furniture/seating/ergonomic-chairs" },
  { label: "PC Builder", href: "/custom-lab" },
];

function CartIcon({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      className="relative flex items-center justify-center text-white transition-colors hover:text-[#00ffff]"
      aria-label={`View cart – ${count} items`}
    >
      <ShoppingCart size={22} />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#00ffff] text-[10px] font-black text-black">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function SearchBar({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Live search — debounce 250ms, fetch top 6 matches
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    const t = setTimeout(() => {
      fetchProducts({ search: q, limit: 6 })
        .then((d) => setResults(d.items))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function goToResults() {
    const q = query.trim();
    if (!q) return;
    router.push(`/components/processors?search=${encodeURIComponent(q)}`);
    onClose();
  }

  function goToProduct(id: string) {
    router.push(`/product/${id}`);
    onClose();
  }

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: "1400px" }}>
      <form
        onSubmit={(e) => { e.preventDefault(); goToResults(); }}
        className="flex h-14 w-full items-center bg-zinc-900 px-4"
      >
        <Search size={20} className="flex-none text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, brands, categories…"
          className="flex-1 border-none bg-transparent px-4 text-base text-white outline-none placeholder:text-zinc-600"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="mr-2 text-zinc-500 hover:text-white">
            <X size={16} />
          </button>
        )}
        <button
          type="submit"
          className="flex-none border border-[#00ffff]/30 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#00ffff] transition-colors hover:bg-[#00ffff] hover:text-black"
        >
          Search
        </button>
        <button type="button" onClick={onClose} className="ml-4 text-zinc-500 transition-colors hover:text-white" aria-label="Close search">
          <X size={22} />
        </button>
      </form>

      {/* ── Live results dropdown ── */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 max-h-[70vh] overflow-y-auto border border-zinc-800 bg-[#0d0d0d] shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          {loading ? (
            <div className="px-4 py-6 text-center text-[13px] text-zinc-500">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-[13px] text-zinc-500">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {results.map((p) => {
                const hasSale = p.salePrice !== null && p.salePrice < p.price;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goToProduct(p.id)}
                    className="flex w-full items-center gap-3 border-b border-zinc-800/60 px-4 py-3 text-left transition-colors hover:bg-white/4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13px] font-semibold text-white">{p.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[13px] font-black text-[#00ffff]">
                          {formatVnd(hasSale ? p.salePrice! : p.price)}
                        </span>
                        {hasSale && (
                          <span className="text-[11px] text-zinc-600 line-through">{formatVnd(p.price)}</span>
                        )}
                      </div>
                    </div>
                    <div className="h-12 w-12 shrink-0 border border-zinc-800 bg-[#161616]">
                      {p.thumbnailUrl && (
                        <Image src={p.thumbnailUrl} alt={p.name} width={48} height={48} className="h-full w-full object-contain p-1" unoptimized />
                      )}
                    </div>
                  </button>
                );
              })}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={goToResults}
                className="block w-full px-4 py-3 text-center text-[12px] font-bold uppercase tracking-wider text-[#00ffff] hover:bg-[#00ffff]/10"
              >
                View all results for &ldquo;{query}&rdquo; →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function MainNav() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const cartCount = useCartCount();
  const { user, loaded } = useAuthState();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <nav className="w-full select-none border-b border-zinc-800 bg-black">

      {/* ── MOBILE (< lg) ─────────────────────────────── */}
      <div className="relative flex h-20 items-center justify-between px-4 lg:hidden">

        {/* Hamburger — SheetTrigger cloneElements the Button, no asChild needed */}
        <Sheet>
          <SheetTrigger>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-zinc-300 hover:bg-zinc-900 hover:text-white"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
              <SheetXButton />
            </SheetHeader>

            <SheetBody>
              <nav className="flex flex-col">
                {MOBILE_LINKS.map(({ label, href }) => (
                  /* SheetClose cloneElements Link, injecting onClick → close */
                  <SheetClose key={href}>
                    <Link
                      href={href}
                      className="block border-b border-zinc-800/60 py-4 text-base font-bold uppercase text-white transition-colors hover:text-[#00ffff]"
                    >
                      {label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetBody>

            <SheetFooter>
              {loaded && user ? (
                /* Logged-in quick links */
                <div className="border border-[#00ffff]/20 bg-[#00ffff]/5 p-3">
                  <p className="truncate text-sm font-bold text-white">{user.fullName}</p>
                  <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <SheetClose>
                      <Link
                        href="/account"
                        className="block border border-zinc-700 py-2 text-center text-xs font-bold uppercase tracking-wider text-zinc-300 hover:border-white hover:text-white"
                      >
                        Account
                      </Link>
                    </SheetClose>
                    <SheetClose>
                      <Link
                        href="/account?tab=orders"
                        className="block border border-zinc-700 py-2 text-center text-xs font-bold uppercase tracking-wider text-zinc-300 hover:border-white hover:text-white"
                      >
                        Orders
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              ) : (
                /* Logged-out auth buttons */
                <div className="grid grid-cols-2 gap-3">
                  <LoginOverlay
                    triggerButton={
                      <button
                        type="button"
                        className="border border-zinc-700 px-4 py-3 text-center text-sm font-bold uppercase tracking-wider text-zinc-200 transition-colors hover:border-white hover:text-white"
                      >
                        Sign In
                      </button>
                    }
                  />
                  <SheetClose>
                    <Link
                      href="/login"
                      className="block border border-[#00ffff]/40 px-4 py-3 text-center text-sm font-bold uppercase tracking-wider text-[#00ffff] transition-colors hover:bg-[#00ffff] hover:text-black"
                    >
                      Register
                    </Link>
                  </SheetClose>
                </div>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Logo — centred absolutely */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Logo />
        </div>

        {/* Right: search + cart */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="text-zinc-300 transition-colors hover:text-white"
            aria-label="Search"
          >
            <Search size={22} />
          </button>
          <CartIcon count={cartCount} />
        </div>
      </div>

      {/* ── DESKTOP (≥ lg) ────────────────────────────── */}
      {isDesktop && (
        <div className="flex h-24 items-center px-6 transition-all duration-300">
          {searchOpen ? (
            <SearchBar onClose={() => setSearchOpen(false)} />
          ) : (
            <div className="flex w-full items-center justify-between">
              {/* Logo */}
              <div className="flex-none">
                <Logo />
              </div>

              {/* Mega-menu — centred */}
              <div className="flex flex-1 justify-center">
                <CategoryMenu />
              </div>

              {/* Utility: search · cart · user */}
              <div className="flex flex-none items-center gap-5">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="text-zinc-400 transition-colors hover:text-white"
                  aria-label="Search"
                >
                  <Search size={22} />
                </button>

                <CartIcon count={cartCount} />

                <UserMenu />
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
