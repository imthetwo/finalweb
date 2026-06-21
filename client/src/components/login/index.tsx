"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import { LoginOverlay } from "./LoginOverlay";
import { RegisterOverlay } from "./RegisterOverlay";

type AuthDialog = "none" | "login" | "register";

export default function LoginPage() {
  const [dialog, setDialog] = useState<AuthDialog>("none");

  return (
    <>
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

      <div className="min-h-screen bg-[#0a0a0a] px-4 py-10 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-10">
          <section className="grid min-h-[56vh] gap-6 border border-zinc-800 bg-[linear-gradient(135deg,#090909_0%,#111111_50%,#0a0a0a_100%)] p-6 md:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-zinc-500">Pecify Store</p>
              <h1 className="mt-4 max-w-2xl text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
                Sign in to your account.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
                Access your orders, wishlist, and PC builds — all in one place.
              </p>

              <div className="mt-8 flex gap-4">
                <Button
                  onClick={() => setDialog("login")}
                  className="rounded-none bg-white px-6 py-6 font-black uppercase tracking-[0.22em] text-black hover:bg-zinc-200"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => setDialog("register")}
                  variant="outline"
                  className="rounded-none border-zinc-600 px-6 py-6 font-black uppercase tracking-[0.22em] text-white hover:border-white hover:bg-transparent"
                >
                  Create Account
                </Button>
              </div>
            </div>

            <div className="grid gap-3 content-start">
              {[
                "Mechanical keyboards",
                "Custom PC parts",
                "Gaming peripherals",
                "Build consultation",
              ].map((item) => (
                <div key={item} className="border border-zinc-800 bg-black/30 px-4 py-4 text-sm text-zinc-300">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="min-h-44 border border-zinc-800 bg-[#0f0f0f] p-4">
                <div className="h-28 border border-zinc-800 bg-white/5" />
                <div className="mt-4 h-3 w-2/3 bg-white/10" />
                <div className="mt-2 h-3 w-1/2 bg-white/10" />
              </div>
            ))}
          </section>

          <section className="min-h-[48vh] border border-zinc-800 bg-black/40 p-6 lg:p-10">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="border border-zinc-800 bg-white/5 px-4 py-5 text-sm text-zinc-400">
                  Scroll row {index + 1}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
