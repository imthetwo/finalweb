"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { register as registerAccount } from "@/lib/api/auth";
import { saveToken } from "@/lib/auth";
import { syncGuestDataToAccount } from "../utils/syncGuestDataToAccount";

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

export function useRegisterForm(onSuccess: () => void) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", subscribeNewsletter: true },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const data = await registerAccount(values.fullName, values.email, values.password, values.subscribeNewsletter);
      saveToken(data.access_token);
      // Claim past guest orders placed with this email + merge the guest cart.
      // (Common flow: checked out as guest before, now registering with the
      // same email — their order history should carry over.)
      await syncGuestDataToAccount(data.access_token);
      toast.success("Account created successfully.");
      form.reset();
      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to connect to the authentication server.");
    }
  });

  const clearError = () => setSubmitError(null);

  return { form, submitError, onSubmit, clearError };
}
