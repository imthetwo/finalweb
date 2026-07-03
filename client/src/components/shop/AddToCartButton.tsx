"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { addToGuestCart } from "@/lib/guestCart";
import { useAuthStore } from "@/store/authStore";

const DEFAULT_CLASS =
  "w-full bg-brand px-8 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-white disabled:cursor-not-allowed";

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function AddToCartButton({
  productId,
  className = DEFAULT_CLASS,
  label = "Add to Cart",
}: {
  productId: string;
  className?: string;
  label?: React.ReactNode;
}) {
  const authed = useAuthStore((s) => !!s.user);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function add() {
    setLoading(true);
    try {
      if (authed) {
        await apiFetch("/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId, quantity: 1 }),
        });
      } else {
        addToGuestCart(productId);
      }
      toast.success("Added to cart");
      window.dispatchEvent(new Event("cart-updated"));
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={loading}
      className={`${className} relative overflow-hidden`}
    >
      <span
        className="flex items-center justify-center gap-2 transition-all duration-200"
        style={{ opacity: loading ? 0 : 1 }}
      >
        {done ? (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            ADDED
          </>
        ) : (
          <>
            <ShoppingCart size={15} />
            {label}
          </>
        )}
      </span>

      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </button>
  );
}
