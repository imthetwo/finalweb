"use client";

import { Save, KeyRound } from "lucide-react";

import { type UserProfile } from "@/lib/api";
import { useProfileTab } from "../hooks/useProfileTab";

export function ProfileTab({ profile, onUpdated }: { profile: UserProfile; onUpdated: (p: UserProfile) => void }) {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { form, setForm, pwd, setPwd, savingProfile, savingPwd, saveProfile, savePassword } =
    useProfileTab(profile, onUpdated);

  const inputCls =
    "w-full border border-edge bg-surface px-4 py-2.5 text-sm text-fg outline-none transition-colors focus:border-brand/50 placeholder:text-subtle";
  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted";

  return (
    <div className={`grid gap-6 ${profile.isGoogleUser ? "" : "lg:grid-cols-2"}`}>
      {/* Profile info — when it's the only card (Google users), the card fills the
          full row while its fields stay centered/constrained rather than stretching. */}
      <form onSubmit={saveProfile} className="border border-edge bg-elevated p-6">
        <div className={`space-y-4 ${profile.isGoogleUser ? "mx-auto max-w-lg" : ""}`}>
          <h3 className="text-sm font-black uppercase tracking-wider text-fg">Personal Information</h3>
          <div>
            <label className={labelCls}>Full name</label>
            <input className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              disabled
              readOnly
              value={profile.email}
              title="Email can't be changed — it's verified at registration"
              className={`${inputCls} cursor-not-allowed opacity-60`}
            />
          </div>
          <div>
            <label className={labelCls}>Phone number</label>
            <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Not set" />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 bg-brand px-5 py-2.5 text-sm font-black uppercase tracking-wider text-black transition hover:bg-brand/85 disabled:opacity-50"
          >
            <Save size={13} /> {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {/* Change password — only for local (email/password) accounts.
          Google accounts have no password, so the panel is omitted entirely. */}
      {!profile.isGoogleUser && (
        <form onSubmit={savePassword} className="space-y-4 border border-edge bg-elevated p-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-fg">Change Password</h3>
          <div>
            <label className={labelCls}>Current password</label>
            <input type="password" className={inputCls} value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>New password</label>
            <input type="password" className={inputCls} value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
          </div>
          <button
            type="submit"
            disabled={savingPwd}
            className="inline-flex items-center gap-2 border border-edge px-5 py-2.5 text-sm font-black uppercase tracking-wider text-secondary transition hover:border-fg hover:text-fg disabled:opacity-50"
          >
            <KeyRound size={13} /> {savingPwd ? "Changing…" : "Change password"}
          </button>
        </form>
      )}
    </div>
  );
}
