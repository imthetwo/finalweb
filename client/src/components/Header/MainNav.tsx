"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import CategoryMenu from "@/components/Header/CategoryMenu";
import Logo from "@/components/Header/Logo";
import { CartIcon } from "@/components/Header/CartIcon";
import { SearchBar } from "@/components/Header/SearchBar";
import { UserMenu } from "@/components/Header/UserMenu";
import { useMainNav } from "@/components/Header/hooks/useMainNav";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetBody, SheetClose, SheetContent,
  SheetFooter, SheetHeader, SheetTrigger, SheetXButton,
} from "@/components/ui/sheet";
import { LoginOverlay } from "@/features/auth";
import { Search } from "lucide-react";

const MOBILE_LINKS = [
  { label: "Laptops",          href: "/shop/laptops/laptops" },
  { label: "Prebuilt PCs",     href: "/shop/pcs" },
  { label: "Components",       href: "/shop/components/processors" },
  { label: "Gaming Gear",      href: "/shop/gaming-gear/mechanical-keyboards" },
  { label: "Gaming Furniture", href: "/shop/gaming-furniture" },
  { label: "PC Builder",       href: "/custom-lab" },
];

export default function MainNav() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { searchOpen, setSearchOpen, cartCount, user, loaded } = useMainNav();

  return (
    <nav className="w-full select-none bg-base border-b border-edge">

      {/* ── MOBILE (< lg) ─────────────────────────────────────────────────── */}
      <div className="relative flex h-20 items-center justify-between px-4 lg:hidden">

        {/* Left: Hamburger */}
        <Sheet>
          <SheetTrigger>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-secondary hover:bg-elevated hover:text-fg"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left">
            <SheetHeader>
              <span />
              <SheetXButton />
            </SheetHeader>

            <SheetBody>
              <nav className="flex flex-col">
                {MOBILE_LINKS.map(({ label, href }) => (
                  <SheetClose key={href}>
                    <Link
                      href={href}
                      className="block border-b border-edge/60 py-4 text-base font-bold uppercase text-fg transition-colors hover:text-brand"
                    >
                      {label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetBody>

            <SheetFooter>
              {loaded && user ? (
                <div className="border border-brand/20 bg-brand/5 p-3">
                  <p className="truncate text-sm font-bold text-fg">{user.fullName}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <SheetClose>
                      <Link href="/account" className="block border border-edge py-2 text-center text-xs font-bold uppercase tracking-wider text-secondary hover:border-edge hover:text-fg">
                        Account
                      </Link>
                    </SheetClose>
                    <SheetClose>
                      <Link href="/account?tab=orders" className="block border border-edge py-2 text-center text-xs font-bold uppercase tracking-wider text-secondary hover:border-edge hover:text-fg">
                        Orders
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <LoginOverlay
                    triggerButton={
                      <button type="button" className="block w-full border border-edge px-4 py-3 text-center text-sm font-bold uppercase tracking-wider text-secondary transition-colors hover:border-fg hover:text-fg">
                        Sign In
                      </button>
                    }
                  />
                  <SheetClose>
                    <Link href="/track-order" className="block border border-edge py-2 text-center text-xs font-bold uppercase tracking-wider text-secondary hover:border-edge hover:text-fg">
                      Track an order
                    </Link>
                  </SheetClose>
                </div>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Center: Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Logo />
        </div>

        {/* Right: Search + Cart */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="text-secondary transition-colors hover:text-fg"
            aria-label="Search"
          >
            <Search size={22} />
          </button>
          <CartIcon count={cartCount} />
        </div>
      </div>

      {/* ── DESKTOP (≥ lg) ────────────────────────────────────────────────── */}
      <div className="hidden h-24 items-center px-6 lg:flex">
        {searchOpen ? (
          <SearchBar onClose={() => setSearchOpen(false)} />
        ) : (
          <div className="flex w-full items-center justify-between">

            {/* Left: Logo */}
            <div className="flex-none">
              <Logo />
            </div>

            {/* Center: Category mega-menu */}
            <div className="flex flex-1 justify-center">
              <CategoryMenu />
            </div>

            {/* Right: Search · Cart · User */}
            <div className="flex flex-none items-center gap-5">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="text-secondary transition-colors hover:text-fg"
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
    </nav>
  );
}
