"use client";

import Link from "next/link";
import { Phone, Send, X } from "lucide-react";

import { useAIConsultant } from "./hooks/useAIConsultant";

const QUICK_PROMPTS = [
  "Budget 15.000.000₫, build a PC for smooth Valorant",
  "Workstation for design & video rendering ~30.000.000₫",
  "Streaming setup around 25.000.000₫",
];

function MessageText({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  const re = /\*\*\[([^\]]+)\]\(([^\s)]+)\)\*\*|\[([^\]]+)\]\(([^\s)]+)\)|\*\*([^*]+)\*\*/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  const linkCls = "font-bold text-brand underline decoration-brand/40 hover:decoration-brand";
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const [label, href] = m[1] ? [m[1], m[2]] : m[3] ? [m[3], m[4]] : [null, null];
    if (label && href) {
      nodes.push(
        href.startsWith("/") ? (
          <Link key={k++} href={href} onClick={onNavigate} className={linkCls}>{label}</Link>
        ) : (
          <a key={k++} href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>{label}</a>
        ),
      );
    } else if (m[5]) {
      nodes.push(<strong key={k++} className="font-bold text-fg">{m[5]}</strong>);
    }
    last = re.lastIndex;
  }
  nodes.push(text.slice(last));
  return <>{nodes}</>;
}

export default function AIConsultantFab() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { open, setOpen, messages, input, setInput, loading, send, scrollRef } = useAIConsultant();

  return (
    <>
      {/* ── Floating bubble button ── */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          {/* Speech bubble */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative animate-in fade-in slide-in-from-right-2 duration-500 rounded-xl border border-white/10 bg-elevated px-4 py-2.5 text-body font-bold text-fg shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-colors hover:border-brand/40 hover:text-brand"
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
            className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-black shadow-glow-md transition-all duration-300 hover:scale-110 hover:shadow-glow-lg"
          >
            <Phone size={26} />
            {/* online pulse dot */}
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-edge bg-success" />
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
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-body font-black uppercase tracking-wider text-fg">Pecify Assistant</p>
                <p className="flex items-center gap-1.5 text-2xs text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  PC Build Advisor
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-fg"
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
                    "max-w-[85%] whitespace-pre-wrap px-3.5 py-2.5 text-body leading-relaxed",
                    m.role === "user"
                      ? "bg-brand text-black"
                      : "border border-edge bg-elevated text-secondary",
                  ].join(" ")}
                >
                  <MessageText text={m.text} onNavigate={() => setOpen(false)} />
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

            {/* Quick prompts (only shown at the start) */}
            {messages.length === 1 && !loading && (
              <div className="space-y-2 pt-2">
                <p className="text-2xs font-bold uppercase tracking-wider text-subtle">Quick prompts</p>
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="block w-full border border-edge bg-elevated px-3 py-2 text-left text-sm text-secondary transition-colors hover:border-brand/40 hover:text-brand"
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
              className="flex-1 border border-edge bg-surface px-3 py-2.5 text-body text-fg outline-none transition-colors placeholder:text-subtle focus:border-brand/50 disabled:opacity-60"
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
