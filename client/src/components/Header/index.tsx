"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import MainNav from "./MainNav";
import PromoBar from "./PromoBar";

export default function Header() {
  const pathname = usePathname();

  useEffect(() => {
    // Remount the interactive header tier on route changes so stale UI state cannot survive Back/Forward navigation.
  }, [pathname]);

  if (pathname.startsWith("/custom-lab")) {
    return null;
  }

  return (
    <header className="w-full flex flex-col sticky top-0 z-50">
      <PromoBar />
      <MainNav key={pathname} />
    </header>
  );
}