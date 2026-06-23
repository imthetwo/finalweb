"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registerSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

async function readBackendError(response: Response) {
  const responseText = await response.text();

  if (!responseText) {
    return response.statusText || "Registration failed.";
  }

  try {
    const parsed = JSON.parse(responseText) as {
      message?: string | string[];
      error?: string;
    };

    if (Array.isArray(parsed.message)) {
      return parsed.message.join(", ");
    }

    if (typeof parsed.message === "string") {
      return parsed.message;
    }

    if (typeof parsed.error === "string") {
      return parsed.error;
    }
  } catch {
    return responseText;
  }

  return response.statusText || "Registration failed.";
}

type RegisterOverlayProps = {
  triggerButton?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSwitchToLogin?: () => void;
};

export function RegisterOverlay({ triggerButton, open: controlledOpen, onOpenChange: controlledOnOpenChange, onSwitchToLogin }: RegisterOverlayProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setSubmitError(null);
      setShowPassword(false);
      reset();
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const response = await fetch("http://localhost:3001/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
        }),
      });

      if (!response.ok) {
        const message = await readBackendError(response);
        setSubmitError(message);
        return;
      }

      const data = (await response.json()) as { access_token?: string };

      if (!data?.access_token) {
        setSubmitError("Registration succeeded, but no access token was returned.");
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      toast.success("Account created successfully.");
      reset();
      setShowPassword(false);
      setOpen(false);
    } catch {
      setSubmitError("Unable to connect to the authentication server.");
    }
  });

  const firstError =
    submitError ||
    errors.fullName?.message ||
    errors.email?.message ||
    errors.password?.message ||
    errors.confirmPassword?.message;

  return (
    <Dialog modal={false} open={open} onOpenChange={handleOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}

      <DialogContent className="sm:max-w-100 border-none rounded-none p-0 shadow-2xl bg-white text-black">
        <div className="px-8 pt-8">
          <DialogHeader>
            <DialogTitle className="mb-6 text-2xl font-black uppercase tracking-widest text-black">
              CREATE ACCOUNT
            </DialogTitle>
          </DialogHeader>
        </div>

        <form className="space-y-4 px-8 pb-8" onSubmit={onSubmit}>
          {firstError && (
            <Alert variant="destructive" className="rounded-none border-red-300 bg-red-50 text-red-700">
              {firstError}
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="register-fullname" className="text-xs font-bold uppercase tracking-wider text-subtle">
              Full Name *
            </Label>
            <Input
              id="register-fullname"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              className="rounded-none border-zinc-300 bg-white text-black placeholder:text-secondary focus:border-black focus:ring-0"
              {...register("fullName")}
            />
            {errors.fullName?.message && (
              <p className="text-xs text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-email" className="text-xs font-bold uppercase tracking-wider text-subtle">
              Email Address *
            </Label>
            <Input
              id="register-email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              className="rounded-none border-zinc-300 bg-white text-black placeholder:text-secondary focus:border-black focus:ring-0"
              {...register("email")}
            />
            {errors.email?.message && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="relative space-y-1.5">
            <Label htmlFor="register-password" className="text-xs font-bold uppercase tracking-wider text-subtle">
              Password *
            </Label>
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="rounded-none border-zinc-300 bg-white pr-10 text-black placeholder:text-secondary focus:border-black focus:ring-0"
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-secondary hover:text-zinc-700"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {errors.password?.message && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-confirm" className="text-xs font-bold uppercase tracking-wider text-subtle">
              Confirm Password *
            </Label>
            <Input
              id="register-confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="rounded-none border-zinc-300 bg-white text-black placeholder:text-secondary focus:border-black focus:ring-0"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword?.message && (
              <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-none bg-black py-6 text-sm font-black uppercase tracking-widest text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creating account..." : "CREATE ACCOUNT"}
          </Button>

          <div className="text-center">
            {onSwitchToLogin ? (
              <button
                type="button"
                onClick={() => {
                  handleOpenChange(false);
                  onSwitchToLogin();
                }}
                className="text-sm font-semibold text-black underline underline-offset-2 hover:text-subtle"
              >
                Already have an account? Sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="text-sm font-semibold text-black underline underline-offset-2 hover:text-subtle"
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
