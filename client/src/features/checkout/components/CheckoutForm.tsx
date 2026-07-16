"use client";
// "use client" because: useState, useEffect, event handlers (form submit, API calls)

import { Tag, X } from "lucide-react";

import { formatVnd } from "@/lib/format";
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
    couponInput, setCouponInput,
    couponCode, discount, couponLoading,
    applyCoupon, removeCoupon, submit,
  } = useCheckoutForm();

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
              {/* Email for guest — optional but useful for order tracking */}
              {!isLoggedIn && (
                <div>
                  <label className={labelCls}>Email (optional)</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className={inputCls}
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-subtle">
                    We'll send your order ID here — without it, you'll need your phone number and the ID to track your order later.
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

          {/* Coupon */}
          <div className="border border-edge bg-elevated p-6">
            <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-secondary">
              Coupon code
            </h2>
            {couponCode ? (
              <div className="flex items-center justify-between border border-success/30 bg-success/5 px-4 py-2.5">
                <div className="flex items-center gap-2 text-success">
                  <Tag size={14} />
                  <span className="text-body font-bold">{couponCode}</span>
                  <span className="text-sm text-success/80">— {formatVnd(discount)} off</span>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="ml-2 text-muted transition hover:text-fg"
                  aria-label="Remove coupon"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                  placeholder="Enter coupon code"
                  className="flex-1 border border-edge bg-surface px-4 py-2.5 text-sm uppercase text-fg outline-none transition-colors focus:border-brand/50 placeholder:normal-case placeholder:text-subtle"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="border border-edge px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-secondary transition hover:border-fg hover:text-fg disabled:opacity-40"
                >
                  {couponLoading ? "…" : "Apply"}
                </button>
              </div>
            )}
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
