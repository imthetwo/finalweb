"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { login } from "@/lib/api/auth";
import { saveToken } from "@/lib/auth";
import { syncGuestDataToAccount } from "../utils/syncGuestDataToAccount";

export const loginSchema = z.object({
  email:    z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export function useLoginForm(onSuccess: () => void) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const data = await login(values.email, values.password);
      saveToken(data.access_token);
      // Claim past guest orders placed with this email + merge the guest cart.
      await syncGuestDataToAccount(data.access_token);
      toast.success("Signed in successfully.");
      form.reset();
      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to connect to the authentication server.");
    }
  });

  const clearError = () => setSubmitError(null);

  return { form, submitError, onSubmit, clearError };
}
