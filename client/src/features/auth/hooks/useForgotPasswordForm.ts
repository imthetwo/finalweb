import { useState } from "react";
import { toast } from "sonner";

import { forgotPassword } from "@/lib/api/auth";

type Step = "form" | "sent";

// Logic for the forgot-password screen — submitting the email and tracking which
// step (form vs. sent) to show. The component only renders based on this.
export function useForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep("sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return { email, setEmail, loading, step, submit };
}
