"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiUrl } from "@/lib/api/client";
import { useLoginForm } from "./hooks/useLoginForm";

type LoginOverlayProps = {
  triggerButton?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSwitchToRegister?: () => void;
};

export function LoginOverlay({ triggerButton, open: controlledOpen, onOpenChange: controlledOnOpenChange, onSwitchToRegister }: LoginOverlayProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const { form, submitError, onSubmit, clearError } = useLoginForm(() => {
    setShowPassword(false);
    setOpen(false);
  });

  const { register, formState: { errors, isSubmitting } } = form;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) { clearError(); setShowPassword(false); form.reset(); }
  };

  return (
    <Dialog modal={false} open={open} onOpenChange={handleOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}

      <DialogContent className="w-190 border-none rounded-none p-0 shadow-2xl bg-white text-black">
        <div className="px-8 pt-8">
          <DialogHeader>
            <DialogTitle className="mb-6 text-2xl font-black uppercase tracking-widest text-black">
              SIGN IN
            </DialogTitle>
          </DialogHeader>
        </div>

        <form className="space-y-4 px-8 pb-8" onSubmit={onSubmit}>
          {(submitError || Object.keys(errors).length > 0) && (
            <Alert variant="destructive" className="rounded-none border-red-300 bg-red-50 text-red-700">
              {submitError || errors.email?.message || errors.password?.message}
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-subtle">
              Email Address *
            </Label>
            <Input id="login-email" type="email" placeholder="Enter your email" autoComplete="email"
              className="rounded-none border-zinc-300 bg-white text-black placeholder:text-secondary focus:border-black focus:ring-0"
              {...register("email")} />
            {errors.email?.message && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="relative space-y-1.5">
            <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-subtle">
              Password *
            </Label>
            <Input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password"
              className="rounded-none border-zinc-300 bg-white pr-10 text-black placeholder:text-secondary focus:border-black focus:ring-0"
              {...register("password")} />
            <button type="button" className="absolute right-3 top-9 text-secondary hover:text-zinc-700"
              onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {errors.password?.message && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-xs font-semibold text-muted underline underline-offset-2 hover:text-black">
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" disabled={isSubmitting}
            className="w-full rounded-none bg-black py-6 text-sm font-black uppercase tracking-widest text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? "Signing in..." : "SIGN IN"}
          </Button>

          <div className="relative my-2 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-2xs font-bold uppercase tracking-widest text-secondary">or</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <button type="button" onClick={() => { window.location.href = getApiUrl("/auth/google"); }}
            className="flex w-full items-center justify-center gap-3 rounded-none border border-zinc-300 bg-white py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div className="text-center">
            {onSwitchToRegister ? (
              <button type="button" onClick={() => { handleOpenChange(false); onSwitchToRegister(); }}
                className="text-sm font-semibold text-black underline underline-offset-2 hover:text-subtle">
                Don&apos;t have an account yet?
              </button>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-black underline underline-offset-2 hover:text-subtle">
                Don&apos;t have an account yet?
              </Link>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
