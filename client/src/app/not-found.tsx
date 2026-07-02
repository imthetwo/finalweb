import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-base px-4 text-center text-fg">
      <p className="text-[8rem] font-black leading-none text-brand/30">404</p>
      <SearchX size={48} className="mt-2 text-subtle" />
      <h1 className="mt-4 text-2xl font-black uppercase tracking-tight text-fg">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-body text-secondary">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 bg-brand px-8 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-brand/85"
      >
        Back to home
      </Link>
    </main>
  );
}
