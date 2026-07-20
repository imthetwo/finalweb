import { useState } from "react";
import { toast } from "sonner";

import { subscribeNewsletter } from "@/lib/api/newsletter";

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
      const res = await subscribeNewsletter(email.trim(), "landing-page");
      if (res.alreadySubscribed) {
        toast.message("This email is already subscribed.");
      } else {
        toast.success("Almost there! Check your inbox to confirm your subscription.");
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
