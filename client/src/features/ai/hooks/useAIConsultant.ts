import { useEffect, useRef, useState } from "react";

import { sendChatMessage } from "@/lib/api/ai";
import type { ChatTurn } from "@/types/api";

const WELCOME: ChatTurn = {
  role: "model",
  text: "Hi! Tell me your **budget** and **needs** (gaming, work, rendering…) and I'll recommend an in-stock build.",
};

// Data/logic for the AI consultant — chat history, sending messages to /ai/chat,
// panel open state and auto-scroll. The component only renders the bubble/panel.
export function useAIConsultant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll down to the newest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    // Mirrors ChatDto.message's @MaxLength(2000) — a friendly inline reply
    // instead of a round-trip just to get the same limit back from the API.
    if (message.length > 2000) {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: message },
        { role: "model", text: "That question is too long (max 2000 characters) — try shortening it." },
      ]);
      setInput("");
      return;
    }

    const history = messages.filter((m) => m !== WELCOME);
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(message, history);
      setMessages((prev) => [...prev, { role: "model", text: res.reply }]);
    } catch (err) {
      // Show the real reason when the server gave one (e.g. validation), and
      // fall back to a generic message only for an actual network failure.
      const text = err instanceof Error && err.message
        ? err.message
        : "Sorry, I'm having a connection issue. Please try again in a moment!";
      setMessages((prev) => [...prev, { role: "model", text }]);
    } finally {
      setLoading(false);
    }
  }

  return { open, setOpen, messages, input, setInput, loading, send, scrollRef };
}
