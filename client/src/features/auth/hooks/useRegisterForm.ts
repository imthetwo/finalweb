"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { register as registerAccount, resendVerificationByEmail } from "@/lib/api/auth";

export const registerSchema = z.object({
  fullName:            z.string().min(2, "Please enter your full name."),
  email:               z.string().email("Please enter a valid email address."),
  password:            z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword:     z.string(),
  subscribeNewsletter: z.boolean(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

// `onSuccess` is not called on a successful register anymore — verification is
// mandatory, so there's no session to hand off yet. The overlay instead shows
// a "check your email" state (see registeredEmail) until they click the link.
export function useRegisterForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", subscribeNewsletter: true },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const data = await registerAccount(values.fullName, values.email, values.password, values.subscribeNewsletter);
      setRegisteredEmail(data.email);
      form.reset();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to connect to the authentication server.");
    }
  });

  async function resendEmail() {
    if (!registeredEmail) return;
    setResending(true);
    try {
      await resendVerificationByEmail(registeredEmail);
      toast.success("Verification email resent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend email.");
    } finally {
      setResending(false);
    }
  }

  const clearError = () => setSubmitError(null);
  const reset = () => { setRegisteredEmail(null); setSubmitError(null); form.reset(); };

  return { form, submitError, onSubmit, clearError, registeredEmail, resendEmail, resending, reset };
}
