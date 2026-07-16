"use client";

import Link from "next/link";
import { LogOut, Shield } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccountPage } from "./hooks/useAccountPage";
import { ProfileTab } from "./components/ProfileTab";
import OrdersTab from "./components/OrdersTab";
import WishlistTab from "./components/WishlistTab";
import { AddressBookTab } from "./components/AddressBookTab";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function AccountPage() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const { profile, setProfile, loading, initialTab, logout } = useAccountPage();

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted">Loading account…</div>;
  }
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-base text-fg">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-edge pb-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center border border-brand/30 bg-brand/10 text-lg font-black text-brand">
              {initials(profile.fullName)}
            </span>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wide text-fg">{profile.fullName}</h1>
              <p className="text-body text-muted">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {profile.role === "ADMIN" && (
              <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 border border-brand/40 px-3 py-2 text-xs font-black uppercase tracking-wider text-brand transition hover:bg-brand/10">
                <Shield size={12} /> Admin
              </Link>
            )}
            <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 border border-edge px-3 py-2 text-xs font-black uppercase tracking-wider text-secondary transition hover:border-destructive hover:text-destructive">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[
            { label: "Orders", value: profile._count?.orders ?? 0 },
            { label: "Wishlist", value: profile._count?.wishlists ?? 0 },
          ].map((s) => (
            <div key={s.label} className="border border-edge bg-elevated p-4 text-center">
              <p className="text-2xl font-black text-fg">{s.value}</p>
              <p className="text-2xs font-bold uppercase tracking-wider text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="mb-6 grid h-auto grid-cols-4 bg-surface p-1">
            <TabsTrigger value="profile" className="text-sm font-bold uppercase tracking-wider data-[state=active]:bg-brand data-[state=active]:text-black">Profile</TabsTrigger>
            <TabsTrigger value="orders" className="text-sm font-bold uppercase tracking-wider data-[state=active]:bg-brand data-[state=active]:text-black">Orders</TabsTrigger>
            <TabsTrigger value="wishlist" className="text-sm font-bold uppercase tracking-wider data-[state=active]:bg-brand data-[state=active]:text-black">Wishlist</TabsTrigger>
            <TabsTrigger value="addresses" className="text-sm font-bold uppercase tracking-wider data-[state=active]:bg-brand data-[state=active]:text-black">Addresses</TabsTrigger>
          </TabsList>

          <TabsContent value="profile"><ProfileTab profile={profile} onUpdated={setProfile} /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="wishlist"><WishlistTab /></TabsContent>
          <TabsContent value="addresses"><AddressBookTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
