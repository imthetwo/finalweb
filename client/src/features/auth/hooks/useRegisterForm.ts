"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api/client";
import { saveToken } from "@/lib/auth";
import { readBackendError } from "../utils/readBackendError";

export const registerSchema = z.object({
  fullName:        z.string().min(2, "Please enter your full name."),
  email:           z.string().email("Please enter a valid email address."),
  password:        z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export function useRegisterForm(onSuccess: () => void) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const res = await fetch(getApiUrl("/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: values.fullName, email: values.email, password: values.password }),
      });
      if (!res.ok) { setSubmitError(await readBackendError(res, "Registration failed.")); return; }
      const data = (await res.json()) as { access_token?: string };
      if (!data?.access_token) { setSubmitError("No access token returned."); return; }
      saveToken(data.access_token);
      toast.success("Account created successfully.");
      form.reset();
      onSuccess();
    } catch {
      setSubmitError("Unable to connect to the authentication server.");
    }
  });

  const clearError = () => setSubmitError(null);

  return { form, submitError, onSubmit, clearError };
}
