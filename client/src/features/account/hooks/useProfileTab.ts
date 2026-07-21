import { useState } from "react";
import { toast } from "sonner";

import { changePassword, updateProfile, type UserProfile } from "@/lib/api";

// Data/logic for the account Profile tab — editing profile fields and changing
// the password. The component only wires these to inputs and buttons.
export function useProfileTab(profile: UserProfile, onUpdated: (p: UserProfile) => void) {
  const [form, setForm] = useState({
    fullName: profile.fullName ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
  });
  const [pwd, setPwd] = useState({ current: "", next: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Mirrors UpdateProfileDto (server/src/users/dto/update-profile.dto.ts).
  function validateProfile(): string | null {
    const name = form.fullName.trim();
    if (!/^[\p{L}][\p{L}\s.'-]{1,59}$/u.test(name)) {
      return "Full name must contain letters only (no numbers), 2–60 characters.";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return "Please enter a valid email address.";
    }
    if (form.phone.trim() && !/^(0\d{9}|\+84\d{9})$/.test(form.phone.trim())) {
      return "Phone must be a valid Vietnamese number, e.g. 0901234567.";
    }
    return null;
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const error = validateProfile();
    if (error) { toast.error(error); return; }
    setSavingProfile(true);
    try {
      // Phone is always sent (even "") so clearing the field back to "not
      // set" still works — the backend skips format validation on "" but
      // still applies it, so this stays consistent with an empty phone.
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };
      const updated = await updateProfile(payload);
      onUpdated(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwd.current) { toast.error("Current password is required"); return; }
    if (pwd.next.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    setSavingPwd(true);
    try {
      await changePassword(pwd.current, pwd.next);
      toast.success("Password changed successfully");
      setPwd({ current: "", next: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSavingPwd(false);
    }
  }

  return { form, setForm, pwd, setPwd, savingProfile, savingPwd, saveProfile, savePassword };
}
