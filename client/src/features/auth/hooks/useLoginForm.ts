"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api/client";
import { saveToken } from "@/lib/auth";
import { getGuestCart, clearGuestCart } from "@/lib/guestCart";
import { readBackendError } from "../utils/readBackendError";

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
      const res = await fetch(getApiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) { setSubmitError(await readBackendError(res, "Login failed.")); return; }
      const data = (await res.json()) as { access_token?: string };
      if (!data?.access_token) { setSubmitError("No access token returned."); return; }
      saveToken(data.access_token);
      // Merge guest cart items into the server cart
      const guestItems = getGuestCart();
      if (guestItems.length > 0) {
        await Promise.allSettled(
          guestItems.map((item) =>
            fetch(getApiUrl("/cart/items"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${data.access_token}`,
              },
              body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
            })
          )
        );
        clearGuestCart();
        window.dispatchEvent(new Event("cart-updated"));
      }
      toast.success("Signed in successfully.");
      form.reset();
      onSuccess();
    } catch {
      setSubmitError("Unable to connect to the authentication server.");
    }
  });

  const clearError = () => setSubmitError(null);

  return { form, submitError, onSubmit, clearError };
}
