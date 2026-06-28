"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { User, Package, Wrench, LogOut, ChevronDown, Shield } from "lucide-react";

import { useAuthState } from "@/hooks/useAuthState";
import { LoginOverlay } from "@/features/auth/LoginOverlay";
import { RegisterOverlay } from "@/features/auth/RegisterOverlay";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const USER_LINKS = [
  { label: "My Account", href: "/account", icon: User },
  { label: "My Orders", href: "/account?tab=orders", icon: Package },
  { label: "My Builds", href: "/account?tab=builds", icon: Wrench },
];

type AuthDialog = "none" | "login" | "register";

export function UserMenu() {
  const { user, loaded, logout } = useAuthState();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<AuthDialog>("none");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!loaded) {
    return (
      <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setDialog("login")}
          className="flex items-center gap-1.5 border border-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-secondary transition-all hover:border-brand/40 hover:text-brand"
        >
          <User size={13} />
          Sign In
        </button>
        <LoginOverlay
          open={dialog === "login"}
          onOpenChange={(o) => setDialog(o ? "login" : "none")}
          onSwitchToRegister={() => setDialog("register")}
        />
        <RegisterOverlay
          open={dialog === "register"}
          onOpenChange={(o) => setDialog(o ? "register" : "none")}
          onSwitchToLogin={() => setDialog("login")}
        />
      </>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-secondary transition-colors hover:text-fg"
        aria-label="Open account menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center border border-brand/30 bg-brand/10 text-xs font-black text-brand">
          {getInitials(user.fullName)}
        </span>
        <span className="hidden max-w-20 truncate text-sm font-semibold text-fg lg:block">
          {user.fullName.split(" ")[0]}
        </span>
        <ChevronDown
          size={12}
          className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 border border-white/8 bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="text-body font-bold text-fg truncate">{user.fullName}</p>
            <p className="text-xs text-muted truncate">{user.email}</p>
            {user.role === "ADMIN" && (
              <Link
                href="/admin/dashboard"
                onClick={() => setOpen(false)}
                className="mt-1.5 inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wider text-brand"
              >
                <Shield size={10} /> Admin Panel
              </Link>
            )}
          </div>

          <div className="py-1">
            {USER_LINKS.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-body text-secondary transition-colors hover:bg-white/4 hover:text-fg"
              >
                <Icon size={14} className="text-subtle" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/5 py-1">
            <button
              type="button"
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-body text-secondary transition-colors hover:bg-red-950/30 hover:text-destructive"
            >
              <LogOut size={14} className="text-subtle" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
