"use client";

import { usePathname } from "next/navigation";

import MainNav from "./MainNav";

export default function Header() {
  const pathname = usePathname();

  if (pathname.startsWith("/custom-lab")) {
    return null;
  }

  return (
    <header className="w-full flex flex-col sticky top-0 z-50">
      <MainNav key={pathname} />
    </header>
  );
}
