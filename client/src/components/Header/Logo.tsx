import Image from "next/image";
import Link from "next/link";

import logo from "@/assets/logo/Pecify.png";

export default function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="relative h-9 w-9 sm:h-12 sm:w-12">
        <Image
          src={logo}
          alt="Pecify"
          fill
          priority
          sizes="(max-width: 640px) 36px, 48px"
          className="object-contain transition-transform duration-300 group-hover:scale-110"
        />
      </span>
      <span
        className="text-white font-bold text-[24px] sm:text-[28px] uppercase tracking-wide"
        style={{
          fontFamily: '"Saira", sans-serif',
          textRendering: "optimizeLegibility",
          WebkitFontSmoothing: "subpixel-antialiased",
        }}
      >
        PECIFY
      </span>
    </Link>
  );
}