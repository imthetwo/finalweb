"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Bot, Send, X } from "lucide-react";

import { apiFetch } from "@/lib/api";
import logo from "@/assets/logo/Pecify.png";

type ChatTurn = { role: "user" | "model"; text: string };

type ChatResponse = { reply: string; source: "gemini" | "fallback" };

const QUICK_PROMPTS = [
  "Budget 15M VND, build a PC for smooth Valorant",
  "Workstation for design & video rendering ~30M VND",
  "Streaming setup around 25M VND",
];

const WELCOME: ChatTurn = {
  role: "model",
  text: "Hi! I'm Pecify's PC-build assistant 🤖\nTell me your **budget** and **needs** (gaming, work, rendering…) and I'll recommend a build from what's currently in stock!",
};

export default function AIConsultantFab() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll xuống tin nhắn mới nhất
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;

    const history = messages.filter((m) => m !== WELCOME);
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiFetch<ChatResponse>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message, history }),
      });
      setMessages((prev) => [...prev, { role: "model", text: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Sorry, I'm having a connection issue. Please try again in a moment!" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Floating bubble button ── */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          {/* Speech bubble */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative animate-in fade-in slide-in-from-right-2 duration-500 rounded-xl border border-white/10 bg-elevated px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-colors hover:border-brand/40 hover:text-brand"
          >
            You need help?
            {/* tail pointing to the button */}
            <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-white/10 bg-elevated" />
          </button>

          {/* Round AI button */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open AI assistant"
            className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-black shadow-[0_0_24px_rgba(0,255,255,0.45)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_36px_rgba(0,255,255,0.7)]"
          >
            <Bot size={24} />
            {/* online pulse dot */}
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-edge bg-emerald-400" />
            </span>
          </button>
        </div>
      )}

      {/* ── Chat panel ── */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[min(600px,80vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden border border-edge bg-surface shadow-[0_8px_48px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-4 fade-in duration-200">

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-edge bg-[linear-gradient(180deg,#1a2730_0%,#0d0d0d_100%)] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand/10">
                <Image src={logo} alt="Pecify" width={28} height={28} className="object-contain" />
              </div>
              <div>
                <p className="text-[13px] font-black uppercase tracking-wider text-white">Pecify Assistant</p>
                <p className="flex items-center gap-1.5 text-[10px] text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  PC Build Advisor
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "max-w-[85%] whitespace-pre-wrap px-3.5 py-2.5 text-[13px] leading-relaxed",
                    m.role === "user"
                      ? "bg-brand text-black"
                      : "border border-edge bg-elevated text-zinc-200",
                  ].join(" ")}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 border border-edge bg-elevated px-4 py-3">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick prompts (chỉ hiện ở đầu) */}
            {messages.length === 1 && !loading && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-subtle">Quick prompts</p>
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="block w-full border border-edge bg-elevated px-3 py-2 text-left text-[12px] text-secondary transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex shrink-0 items-center gap-2 border-t border-edge bg-surface p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your budget + needs…"
              disabled={loading}
              className="flex-1 border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-[13px] text-white outline-none transition-colors placeholder:text-subtle focus:border-brand/50 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand text-black transition-all hover:bg-brand/85 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
