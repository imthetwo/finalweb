import type { ChatResponse, ChatTurn } from "@/types/api";
import { apiFetch } from "./client";

export const sendChatMessage = (message: string, history: ChatTurn[]) =>
  apiFetch<ChatResponse>("/ai/chat", { method: "POST", body: JSON.stringify({ message, history }) });
