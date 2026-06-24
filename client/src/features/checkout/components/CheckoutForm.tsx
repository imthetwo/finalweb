"use client";
// "use client" vì: useState, useEffect, event handlers (form submit, API calls)

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Tag, X } from "lucide-react";

import { apiFetch, initiatePayment, validateCoupon } from "@/lib/api";
import { formatVnd } from "@/lib/format";

const FIELDS: { key: "recipient" | "phone" | "street" | "district" | "city"; label: string; placeholder: string }[] = [
  { key: "recipient", label: "Full name", placeholder: "Nguyen Van A" },
  { key: "phone", label: "Phone number", placeholder: "0901 234 567" },
  { key: "street", label: "Street address", placeholder: "123 Nguyen Hue, Ward 1" },
  { key: "district", label: "District", placeholder: "District 1" },
  { key: "city", label: "City / Province", placeholder: "Ho Chi Minh City" },
];

const inputCls =
  "w-full border border-edge bg-surface px-4 py-2.5 text-sm text-fg outline-none transition-colors focus:border-brand/50 placeholder:text-subtle";
const labelCls = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted";

export function CheckoutForm() {
  const router = useRouter();

  const [form, setForm] = useState({ recipient: "", phone: "", street: "", district: "", city: "" });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [submitting, setSubmitting] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    try {
      const res = await validateCoupon(code, 0);
      if (res.valid) {
        setCouponCode(code);
        setDiscount(res.discount);
        toast.success(`Coupon applied — discount: ${formatVnd(res.discount)}`);
      } else {
        toast.error(res.message || "Invalid coupon");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not apply coupon");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCouponCode(null);
    setCouponInput("");
    setDiscount(0);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!localStorage.getItem("access_token")) {
      toast.error("Please sign in first");
      return;
    }
    setSubmitting(true);
    try {
      const order = await apiFetch<{ id: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          paymentMethod,
          shippingInfo: form,
          ...(couponCode ? { couponCode } : {}),
        }),
      });

      if (paymentMethod === "COD") {
        toast.success("Order placed successfully!");
        router.push(`/order-success?orderId=${order.id}`);
      } else {
        router.push(`/payment/${paymentMethod.toLowerCase()}?orderId=${order.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-base px-4 py-10 text-fg md:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-8 text-2xl font-black uppercase tracking-wide text-fg">Checkout</h1>

        <form onSubmit={submit} className="space-y-6">
          {/* Shipping info */}
          <div className="border border-edge bg-elevated p-6">
            <h2 className="mb-4 text-[11px] font-black uppercase tracking-wider text-secondary">
              Shipping information
            </h2>
            <div className="space-y-4">
              {FIELDS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    required
                    placeholder={placeholder}
                    className={inputCls}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div className="border border-edge bg-elevated p-6">
            <h2 className="mb-4 text-[11px] font-black uppercase tracking-wider text-secondary">
              Payment method
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {["COD", "MOMO"].map((m) => (
                <label
                  key={m}
                  className={`flex cursor-pointer items-center gap-3 border px-4 py-3 transition ${
                    paymentMethod === m
                      ? "border-brand bg-brand/5 text-fg"
                      : "border-edge text-secondary hover:border-zinc-500"
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
                  <span className="text-[13px] font-bold">{m === "COD" ? "Cash on Delivery" : "MoMo"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Coupon */}
          <div className="border border-edge bg-elevated p-6">
            <h2 className="mb-4 text-[11px] font-black uppercase tracking-wider text-secondary">
              Coupon code
            </h2>

            {couponCode ? (
              <div className="flex items-center justify-between rounded border border-emerald-700/50 bg-emerald-950/20 px-4 py-2.5">
                <div className="flex items-center gap-2 text-success">
                  <Tag size={14} />
                  <span className="text-[13px] font-bold">{couponCode}</span>
                  <span className="text-[12px] text-success/80">— {formatVnd(discount)} off</span>
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
                  className="border border-edge px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-secondary transition hover:border-white hover:text-fg disabled:opacity-40"
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
            className="w-full bg-brand py-3.5 text-[13px] font-black uppercase tracking-wider text-black transition hover:bg-brand/85 disabled:opacity-50"
          >
            {submitting ? "Processing…" : "Place order"}
          </button>
        </form>
      </div>
    </main>
  );
}
