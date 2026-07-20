import type { ConfirmSubscriptionResponse, SubscribeResponse } from "@/types/api";
import { apiFetch } from "./client";

export const subscribeNewsletter = (email: string, source: string) =>
  apiFetch<SubscribeResponse>("/newsletter/subscribe", { method: "POST", body: JSON.stringify({ email, source }) });

export const confirmNewsletter = (token: string) =>
  apiFetch<ConfirmSubscriptionResponse>("/newsletter/confirm", { method: "POST", body: JSON.stringify({ token }) });
