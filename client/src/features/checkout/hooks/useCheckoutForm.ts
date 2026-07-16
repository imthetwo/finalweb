import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { createOrder, validateCoupon, guestCheckout, fetchAddresses, type Address } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import { getGuestCart, clearGuestCart } from "@/lib/guestCart";
import { useAuthState } from "@/hooks/useAuthState";

// Data/logic for the checkout screen — shipping form, payment method, coupon
// apply/remove, and order submission for both logged-in and guest flows. The
// component only wires these to inputs and renders.
export function useCheckoutForm() {
  const router = useRouter();
  // Reactive auth state (same store Header/CartView use) — flips to true the
  // instant the guest signs in via the modal, no page reload needed.
  const { user } = useAuthState();
  const isLoggedIn = !!user;

  const [showLogin, setShowLogin] = useState(false);
  const [form, setForm] = useState({ recipient: "", phone: "", street: "", ward: "", city: "" });
  const [guestEmail, setGuestEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [submitting, setSubmitting] = useState(false);

  // Saved addresses — let a logged-in user pick one instead of retyping.
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  // "Save this address to my address book" — only meaningful (and shown) while
  // the shipping form holds a freshly-typed address, not a saved one being reused.
  const [saveAddress, setSaveAddress] = useState(true);
  const offerSaveAddress = isLoggedIn && selectedAddressId === "new";

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchAddresses()
      .then((list) => {
        setSavedAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def) selectAddress(def.id, list);
      })
      .catch(() => setSavedAddresses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  function selectAddress(id: string | "new", list = savedAddresses) {
    setSelectedAddressId(id);
    if (id === "new") {
      setForm({ recipient: "", phone: "", street: "", ward: "", city: "" });
      return;
    }
    const a = list.find((x) => x.id === id);
    if (a) setForm({ recipient: a.recipient, phone: a.phone, street: a.street, ward: a.ward, city: a.city });
  }

  // Manual edits to the shipping fields fall back to "new" so the picker
  // never shows a saved address selected while its fields no longer match.
  function updateForm(next: typeof form) {
    setSelectedAddressId("new");
    setForm(next);
  }

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

  function redirect(orderId: string) {
    if (paymentMethod === "COD") {
      toast.success("Order placed successfully!");
      router.push(`/order-success?orderId=${orderId}`);
    } else {
      router.push(`/payment/${paymentMethod.toLowerCase()}?orderId=${orderId}`);
    }
  }

  // Client-side validation — mirrors the backend ShippingInfoDto rules so the
  // customer gets a friendly message instead of a 400 from the API.
  function validateShipping(): boolean {
    const name = form.recipient.trim();
    if (!/^[\p{L}][\p{L}\s.'-]{1,59}$/u.test(name)) {
      toast.error("Full name must contain letters only (no numbers).");
      return false;
    }
    if (!/^(0\d{9}|\+84\d{9})$/.test(form.phone.trim())) {
      toast.error("Phone must be a valid Vietnamese number, e.g. 0901234567.");
      return false;
    }
    const street = form.street.trim();
    if (street.length < 3 || !/\p{L}/u.test(street)) {
      toast.error("Street address must include a street name, e.g. 123 Nguyen Hue.");
      return false;
    }
    if (!form.ward.trim()) {
      toast.error("Please select your ward.");
      return false;
    }
    if (!form.city.trim()) {
      toast.error("Please select your city / province.");
      return false;
    }
    if (!isLoggedIn && guestEmail.trim() && !/^\S+@\S+\.\S+$/.test(guestEmail.trim())) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateShipping()) return;
    setSubmitting(true);

    // Send trimmed values so stray spaces never reach the DB
    const shippingInfo = {
      recipient: form.recipient.trim(),
      phone: form.phone.trim(),
      street: form.street.trim(),
      ward: form.ward.trim(),
      city: form.city.trim(),
    };

    try {
      if (isLoggedIn) {
        // ── Logged-in: read from DB cart ──────────────────────────────────────
        const order = await createOrder({
          shippingInfo,
          paymentMethod,
          ...(couponCode ? { couponCode } : {}),
          ...(offerSaveAddress && saveAddress ? { saveAddress: true } : {}),
        });
        redirect(order.id);
      } else {
        // ── Guest: localStorage is the "session cart" ─────────────────────────
        // Read items from localStorage → POST /orders/guest-checkout
        // Backend: $transaction(Order + OrderItem) → stock decrement
        // Frontend: clear localStorage after success (= "clear session")
        const guestItems = getGuestCart();
        if (!guestItems.length) {
          toast.error("Your cart is empty.");
          return;
        }
        const order = await guestCheckout({
          items: guestItems,
          shippingInfo,
          paymentMethod,
          ...(couponCode ? { couponCode } : {}),
          ...(guestEmail.trim() ? { guestEmail: guestEmail.trim() } : {}),
        });
        clearGuestCart();
        window.dispatchEvent(new Event("cart-updated"));
        // Lets the order-success page's "View orders" link jump straight into
        // the order detail on /track-order without retyping the phone number
        // that was just entered — sessionStorage, so it never leaves this tab
        // and never persists beyond it.
        sessionStorage.setItem(`track:${order.id}`, shippingInfo.phone);
        redirect(order.id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    isLoggedIn,
    showLogin, setShowLogin,
    form, setForm: updateForm,
    savedAddresses, selectedAddressId, selectAddress,
    offerSaveAddress, saveAddress, setSaveAddress,
    guestEmail, setGuestEmail,
    paymentMethod, setPaymentMethod,
    submitting,
    couponInput, setCouponInput,
    couponCode, discount, couponLoading,
    applyCoupon, removeCoupon, submit,
  };
}
