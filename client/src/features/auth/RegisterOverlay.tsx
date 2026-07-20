"use client";

import type { ReactNode } from "react";
import { Eye, EyeOff, MailCheck } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterOverlay } from "./hooks/useRegisterOverlay";

type RegisterOverlayProps = {
  triggerButton?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSwitchToLogin?: () => void;
};

export function RegisterOverlay({ triggerButton, open, onOpenChange, onSwitchToLogin }: RegisterOverlayProps) {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const {
    open: isOpen, handleOpenChange, showPassword, togglePassword,
    register, errors, isSubmitting, onSubmit, firstError,
    registeredEmail, resendEmail, resending,
  } = useRegisterOverlay({ open, onOpenChange });

  if (registeredEmail) {
    return (
      <Dialog modal={false} open={isOpen} onOpenChange={handleOpenChange}>
        {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
        <DialogContent className="sm:max-w-100 border-none rounded-none p-0 shadow-2xl bg-white text-black">
          <div className="flex flex-col items-center gap-4 px-8 py-10 text-center">
            <MailCheck size={40} className="text-black" />
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-widest text-black">
                Check your email
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-secondary">
              We sent a verification link to <strong className="text-black">{registeredEmail}</strong>.
              Click it to activate your account — you can&apos;t sign in until then.
            </p>
            <Button
              type="button"
              disabled={resending}
              onClick={resendEmail}
              className="w-full rounded-none bg-black py-6 text-sm font-black uppercase tracking-widest text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resending ? "Resending…" : "Resend email"}
            </Button>
            <button
              type="button"
              onClick={() => { handleOpenChange(false); onSwitchToLogin?.(); }}
              className="text-sm font-semibold text-black underline underline-offset-2 hover:text-subtle"
            >
              Back to sign in
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog modal={false} open={isOpen} onOpenChange={handleOpenChange}>
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
            <Label htmlFor="register-fullname" className="text-xs font-bold uppercase tracking-wider text-subtle">Full Name *</Label>
            <Input id="register-fullname" type="text" placeholder="Enter your full name" autoComplete="name"
              className="rounded-none border-zinc-300 bg-white text-black placeholder:text-secondary focus:border-black focus:ring-0"
              {...register("fullName")} />
            {errors.fullName?.message && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-email" className="text-xs font-bold uppercase tracking-wider text-subtle">Email Address *</Label>
            <Input id="register-email" type="email" placeholder="Enter your email" autoComplete="email"
              className="rounded-none border-zinc-300 bg-white text-black placeholder:text-secondary focus:border-black focus:ring-0"
              {...register("email")} />
            {errors.email?.message && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="relative space-y-1.5">
            <Label htmlFor="register-password" className="text-xs font-bold uppercase tracking-wider text-subtle">Password *</Label>
            <Input id="register-password" type={showPassword ? "text" : "password"} autoComplete="new-password"
              className="rounded-none border-zinc-300 bg-white pr-10 text-black placeholder:text-secondary focus:border-black focus:ring-0"
              {...register("password")} />
            <button type="button" className="absolute right-3 top-9 text-secondary hover:text-zinc-700"
              onClick={togglePassword}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {errors.password?.message && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-confirm" className="text-xs font-bold uppercase tracking-wider text-subtle">Confirm Password *</Label>
            <Input id="register-confirm" type={showPassword ? "text" : "password"} autoComplete="new-password"
              className="rounded-none border-zinc-300 bg-white text-black placeholder:text-secondary focus:border-black focus:ring-0"
              {...register("confirmPassword")} />
            {errors.confirmPassword?.message && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm text-secondary">
            <input
              type="checkbox"
              className="h-4 w-4 accent-black"
              {...register("subscribeNewsletter")}
            />
            Subscribe to the newsletter for exclusive deals
          </label>

          <Button type="submit" disabled={isSubmitting}
            className="w-full rounded-none bg-black py-6 text-sm font-black uppercase tracking-widest text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? "Creating account..." : "CREATE ACCOUNT"}
          </Button>

          <div className="text-center">
            <button type="button"
              onClick={() => { handleOpenChange(false); onSwitchToLogin?.(); }}
              className="text-sm font-semibold text-black underline underline-offset-2 hover:text-subtle">
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
