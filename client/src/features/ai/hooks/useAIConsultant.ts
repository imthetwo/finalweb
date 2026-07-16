import { useEffect, useRef, useState } from "react";

import { sendChatMessage } from "@/lib/api/ai";
import type { ChatTurn } from "@/types/api";

const WELCOME: ChatTurn = {
  role: "model",
  text: "Hi! I'm Pecify's PC-build assistant 🤖\nTell me your **budget** and **needs** (gaming, work, rendering…) and I'll recommend a build from what's currently in stock!",
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

    const history = messages.filter((m) => m !== WELCOME);
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(message, history);
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

  return { open, setOpen, messages, input, setInput, loading, send, scrollRef };
}
