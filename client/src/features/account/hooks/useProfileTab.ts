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

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateProfile(form);
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
