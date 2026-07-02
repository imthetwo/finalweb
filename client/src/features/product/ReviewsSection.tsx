"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { fetchProductReviews, createReview, type Review } from "@/lib/api";
import { getToken } from "@/lib/auth";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "fill-brand text-brand" : "text-subtle"}
        />
      ))}
    </div>
  );
}

export default function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Write-review form state
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetchProductReviews(productId)
      .then((d) => { setReviews(d.reviews); setAverage(d.average); setCount(d.count); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(load, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!getToken()) {
      toast("Sign in to write a review", {
        description: "You need an account to share your experience.",
        action: {
          label: "Sign In",
          onClick: () => { window.location.href = "/login"; },
        },
        duration: 4000,
      });
      return;
    }
    setSubmitting(true);
    try {
      await createReview({ productId, rating, text: text || undefined });
      toast.success("Review submitted");
      setText(""); setRating(5);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto mt-16 max-w-6xl border-t border-edge pt-10">
      <div className="mb-8 flex items-center gap-4">
        <h2 className="text-xl font-black uppercase tracking-wide text-fg">Reviews</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <Stars value={average} size={16} />
            <span className="text-sm text-secondary">{average} ({count})</span>
          </div>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Review list */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="border border-edge bg-elevated p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-black text-brand">
                      {r.user.fullName.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-body font-semibold text-fg">{r.user.fullName}</p>
                      {r.isVerifiedBuy && <p className="text-2xs font-bold uppercase text-success">Verified buyer</p>}
                    </div>
                  </div>
                  <Stars value={r.rating} />
                </div>
                {r.title && <p className="mt-3 text-base font-bold text-fg">{r.title}</p>}
                {r.text && <p className="mt-1 text-body leading-relaxed text-secondary">{r.text}</p>}
                <p className="mt-2 text-xs text-subtle">{new Date(r.createdAt).toLocaleDateString("en-GB")}</p>
              </div>
            ))
          )}
        </div>

        {/* Write review */}
        <form onSubmit={submit} className="h-fit space-y-4 border border-edge bg-elevated p-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-fg">Write a Review</h3>

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} stars`}>
                  <Star size={22} className={i <= rating ? "fill-brand text-brand" : "text-subtle hover:text-muted"} />
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your experience…"
            rows={4}
            className="w-full resize-none border border-edge bg-surface px-3 py-2 text-body text-fg outline-none focus:border-brand/50 placeholder:text-subtle"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand py-2.5 text-sm font-black uppercase tracking-wider text-brand-fg hover:bg-brand/85 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      </div>
    </section>
  );
}
