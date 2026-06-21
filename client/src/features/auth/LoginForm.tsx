"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Form from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        setError(body?.message || "Login failed. Please check your credentials.");
        return;
      }

      const data = await res.json();
      const token = data?.access_token;
      if (token) {
        try {
          localStorage.setItem("access_token", token);
        } catch {
          document.cookie = `access_token=${token}; path=/`;
        }
        router.push("/");
      } else {
        setError("No access token returned from server.");
      }
    } catch {
      setError("Unable to connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-screen flex-1 items-center justify-center bg-[#0a0a0a] px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#0f0f10] p-6 shadow-[0_0_80px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#00ffff]">Account Access</p>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">Sign in</h2>
          <p className="mt-2 text-sm text-zinc-400">Access orders, wishlist, and custom build data.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}

        <Form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              className="mt-1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 transition hover:text-[#00ffff]"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              className="mt-1"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button type="submit" className={cn("w-full", loading && "opacity-70")} disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <button
              type="button"
              onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/google`; }}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </Form>

        <div className="mt-6 border-t border-zinc-800 pt-4 text-center text-xs uppercase tracking-[0.3em] text-zinc-500">
          Protected by JWT
        </div>
      </div>
    </section>
  );
}
