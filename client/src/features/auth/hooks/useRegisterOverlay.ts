import { useState } from "react";

import { useRegisterForm } from "./useRegisterForm";

// Data/logic for the register overlay — open state (controlled or internal),
// password visibility, and wiring useRegisterForm's onSuccess to close/reset.
// The component only renders based on this.
export function useRegisterOverlay({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const { form, submitError, onSubmit, clearError } = useRegisterForm(() => {
    setShowPassword(false);
    setOpen(false);
  });

  const { register, formState: { errors, isSubmitting } } = form;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) { clearError(); setShowPassword(false); form.reset(); }
  }

  function togglePassword() {
    setShowPassword((v) => !v);
  }

  const firstError = submitError || errors.fullName?.message || errors.email?.message
    || errors.password?.message || errors.confirmPassword?.message;

  return {
    open, handleOpenChange, showPassword, togglePassword,
    register, errors, isSubmitting, onSubmit, firstError,
  };
}
