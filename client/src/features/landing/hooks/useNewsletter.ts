import { useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";

type SubscribeResponse = {
  ok: boolean;
  message?: string;
  alreadySubscribed?: boolean;
};

// Logic for the newsletter signup — validating and submitting the email.
export function useNewsletter() {
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

  return { email, setEmail, loading, handleSubmit };
}
