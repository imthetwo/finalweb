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
          className="flex items-center gap-1.5 border border-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-300 transition-all hover:border-[#00ffff]/40 hover:text-[#00ffff]"
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
        className="flex items-center gap-2 text-zinc-300 transition-colors hover:text-white"
        aria-label="Open account menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center border border-[#00ffff]/30 bg-[#00ffff]/10 text-[11px] font-black text-[#00ffff]">
          {getInitials(user.fullName)}
        </span>
        <span className="hidden max-w-20 truncate text-[12px] font-semibold text-white lg:block">
          {user.fullName.split(" ")[0]}
        </span>
        <ChevronDown
          size={12}
          className={`text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 border border-white/8 bg-[#0d0d0d] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="text-[13px] font-bold text-white truncate">{user.fullName}</p>
            <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
            {user.role === "ADMIN" && (
              <Link
                href="/admin/dashboard"
                onClick={() => setOpen(false)}
                className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#00ffff]"
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
                className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-zinc-400 transition-colors hover:bg-white/4 hover:text-white"
              >
                <Icon size={14} className="text-zinc-600" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/5 py-1">
            <button
              type="button"
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-zinc-400 transition-colors hover:bg-red-950/30 hover:text-red-400"
            >
              <LogOut size={14} className="text-zinc-600" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
