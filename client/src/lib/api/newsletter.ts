import type { SubscribeResponse } from "@/types/api";
import { apiFetch } from "./client";

export const subscribeNewsletter = (email: string, source: string) =>
  apiFetch<SubscribeResponse>("/newsletter/subscribe", { method: "POST", body: JSON.stringify({ email, source }) });
