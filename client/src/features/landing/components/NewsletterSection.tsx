"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";

import { apiFetch } from "@/lib/api";

type SubscribeResponse = {
  ok: boolean;
  message?: string;
  alreadySubscribed?: boolean;
};

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<SubscribeResponse>("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), source: "landing-page" }),
      });
      if (res.alreadySubscribed) {
        toast.message("This email is already subscribed.");
      } else {
        toast.success("You're subscribed! Watch your inbox for exclusive deals.");
        setEmail("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Subscription failed, please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-base py-20">
      <div className="mx-auto max-w-[700px] px-4 text-center md:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-brand">
          Stay in the Loop
        </p>
        <h2 className="mt-4 text-3xl font-black uppercase leading-tight tracking-tight text-fg md:text-4xl">
          Get Exclusive Deals
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          New arrivals, flash sales, and build guides — delivered straight to
          your inbox. No spam, unsubscribe anytime.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 border border-white/10 bg-white/4 px-5 py-3.5 text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-brand/40 focus:bg-brand/4"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-brand px-7 py-3.5 text-sm font-black uppercase tracking-[0.2em] text-black transition-all duration-200 hover:shadow-glow-btn disabled:opacity-60"
          >
            <Send size={14} />
            {loading ? "Subscribing…" : "Subscribe"}
          </button>
        </form>

        <p className="mt-4 text-[10px] uppercase tracking-[0.15em] text-subtle">
          By subscribing you agree to our Privacy Policy.
        </p>
      </div>
    </section>
  );
}
