import { useState } from "react";

import { useLoginForm } from "./useLoginForm";

// Data/logic for the login overlay — open state (controlled or internal),
// password visibility, and wiring useLoginForm's onSuccess to close/reset.
// The component only renders based on this.
export function useLoginOverlay({
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

  const { form, submitError, onSubmit, clearError } = useLoginForm(() => {
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

  return {
    open, handleOpenChange, showPassword, togglePassword,
    register, errors, isSubmitting, submitError, onSubmit,
  };
}
