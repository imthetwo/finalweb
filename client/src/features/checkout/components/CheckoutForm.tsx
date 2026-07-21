"use client";
// "use client" because: useState, useEffect, event handlers (form submit, API calls)

import { MailCheck } from "lucide-react";

import { LoginOverlay } from "@/features/auth";
import { AddressFields } from "@/components/ui/AddressFields";
import { useCheckoutForm } from "../hooks/useCheckoutForm";

const inputCls =
  "w-full border border-edge bg-surface px-4 py-2.5 text-sm text-fg outline-none transition-colors focus:border-brand/50 placeholder:text-subtle";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted";

export function CheckoutForm() {
  // Logic lives in the hook (defined outside); the component only calls it and renders.
  const {
    isLoggedIn,
    showLogin, setShowLogin,
    form, setForm,
    savedAddresses, selectedAddressId, selectAddress,
    offerSaveAddress, saveAddress, setSaveAddress,
    guestEmail, setGuestEmail,
    paymentMethod, setPaymentMethod,
    submitting,
    awaitingEmailConfirmation,
    submit,
  } = useCheckoutForm();

  if (awaitingEmailConfirmation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-4 py-16">
        <div className="w-full max-w-sm border border-edge bg-elevated p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
            <MailCheck size={26} />
          </div>
          <h1 className="text-lg font-black uppercase tracking-wide text-fg">Check your email</h1>
          <p className="mt-3 text-body text-secondary">
            We sent a confirmation link to <strong className="text-fg">{guestEmail}</strong>. Click it to
            finish placing your order — it's valid for 30 minutes.
          </p>
          <p className="mt-4 text-xs text-subtle">
            Didn't get it? Check your spam folder, or go back and submit again to get a new link.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base px-4 py-10 text-fg md:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-8 text-2xl font-black uppercase tracking-wide text-fg">Checkout</h1>

        {!isLoggedIn && (
          <div className="mb-6 border border-edge bg-elevated px-4 py-3 text-xs text-secondary">
            You are checking out as a guest. Your order will be saved permanently in our system.{" "}
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="text-brand underline decoration-brand/40 hover:decoration-brand"
            >
              Sign in
            </button>{" "}
            to track your orders later.
          </div>
        )}

        <LoginOverlay open={showLogin} onOpenChange={setShowLogin} />

        <form onSubmit={submit} className="space-y-6">
          {/* Shipping info */}
          <div className="border border-edge bg-elevated p-6">
            <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-secondary">
              Shipping information
            </h2>
            <div className="space-y-4">
              {isLoggedIn && savedAddresses.length > 0 && (
                <div>
                  <label className={labelCls}>Use a saved address</label>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => selectAddress(a.id)}
                        className={`border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                          selectedAddressId === a.id
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-edge text-secondary hover:border-secondary"
                        }`}
                      >
                        {a.label || a.recipient}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => selectAddress("new")}
                      className={`border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                        selectedAddressId === "new"
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-edge text-secondary hover:border-secondary"
                      }`}
                    >
                      New address
                    </button>
                  </div>
                </div>
              )}
              <AddressFields value={form} onChange={setForm} />
              {offerSaveAddress && (
                <label className="flex cursor-pointer items-center gap-2.5 text-body text-secondary">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="accent-brand"
                  />
                  Save this address to my address book
                </label>
              )}
              {/* Email for guest — required, it's the only way to recover the
                  order ID if it's lost (no account to log into) */}
              {!isLoggedIn && (
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    required
                    type="email"
                    placeholder="your@email.com"
                    className={inputCls}
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-subtle">
                    We’ll send your order confirmation and ID here — you’ll need it to track your order later.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment method */}
          <div className="border border-edge bg-elevated p-6">
            <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-secondary">
              Payment method
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {["COD", "MOMO"].map((m) => (
                <label
                  key={m}
                  className={`flex cursor-pointer items-center gap-3 border px-4 py-3 transition ${
                    paymentMethod === m
                      ? "border-brand bg-brand/5 text-fg"
                      : "border-edge text-secondary hover:border-secondary"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m}
                    checked={paymentMethod === m}
                    onChange={() => setPaymentMethod(m)}
                    className="accent-brand"
                  />
                  <span className="text-body font-bold">{m === "COD" ? "Cash on Delivery" : "MoMo"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand py-3.5 text-body font-black uppercase tracking-wider text-black transition hover:bg-brand/85 disabled:opacity-50"
          >
            {submitting ? "Processing…" : "Place order"}
          </button>
        </form>
      </div>
    </main>
  );
}
