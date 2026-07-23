"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { login, resendVerificationByEmail } from "@/lib/api/auth";
import { saveToken } from "@/lib/auth";
import { syncGuestDataToAccount } from "../utils/syncGuestDataToAccount";

export const loginSchema = z.object({
  email:    z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const UNVERIFIED_MESSAGE = "Please verify your email before signing in — check your inbox for the verification link.";

export function useLoginForm(onSuccess: () => void, redirectTo?: string) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setUnverifiedEmail(null);
    try {
      const data = await login(values.email, values.password);
      saveToken(data.access_token);
      // Claim past guest orders placed with this email + merge the guest cart.
      await syncGuestDataToAccount(data.access_token);
      toast.success("Signed in successfully.");
      form.reset();
      onSuccess();
      // Send them back to the page an auth guard bounced them from (see
      // login/page.tsx + useMainNav), instead of just leaving them wherever
      // closing the dialog happens to land them.
      if (redirectTo) router.push(redirectTo);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to connect to the authentication server.";
      setSubmitError(message);
      if (message === UNVERIFIED_MESSAGE) setUnverifiedEmail(values.email);
    }
  });

  async function resendEmail() {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await resendVerificationByEmail(unverifiedEmail);
      toast.success("Verification email resent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend email.");
    } finally {
      setResending(false);
    }
  }

  const clearError = () => { setSubmitError(null); setUnverifiedEmail(null); };

  return { form, submitError, onSubmit, clearError, unverifiedEmail, resendEmail, resending };
}
