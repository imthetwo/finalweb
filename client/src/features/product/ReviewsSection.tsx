"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { fetchProductReviews, createReview, type Review } from "@/lib/api";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "fill-[#00ffff] text-[#00ffff]" : "text-zinc-700"}
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
  const [title, setTitle] = useState("");
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
    if (!localStorage.getItem("access_token")) {
      toast.error("Please sign in to write a review");
      return;
    }
    setSubmitting(true);
    try {
      await createReview({ productId, rating, title: title || undefined, text: text || undefined });
      toast.success("Review submitted");
      setTitle(""); setText(""); setRating(5);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto mt-16 max-w-6xl border-t border-zinc-800 pt-10">
      <div className="mb-8 flex items-center gap-4">
        <h2 className="text-xl font-black uppercase tracking-wide text-white">Reviews</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <Stars value={average} size={16} />
            <span className="text-sm text-zinc-400">{average} ({count})</span>
          </div>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Review list */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-zinc-500">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="border border-zinc-800 bg-[#111] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00ffff]/10 text-[11px] font-black text-[#00ffff]">
                      {r.user.fullName.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-white">{r.user.fullName}</p>
                      {r.isVerifiedBuy && <p className="text-[10px] font-bold uppercase text-emerald-400">Verified buyer</p>}
                    </div>
                  </div>
                  <Stars value={r.rating} />
                </div>
                {r.title && <p className="mt-3 text-[14px] font-bold text-white">{r.title}</p>}
                {r.text && <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">{r.text}</p>}
                <p className="mt-2 text-[11px] text-zinc-600">{new Date(r.createdAt).toLocaleDateString("en-GB")}</p>
              </div>
            ))
          )}
        </div>

        {/* Write review */}
        <form onSubmit={submit} className="h-fit space-y-4 border border-zinc-800 bg-[#111] p-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Write a Review</h3>

          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} stars`}>
                  <Star size={22} className={i <= rating ? "fill-[#00ffff] text-[#00ffff]" : "text-zinc-700 hover:text-zinc-500"} />
                </button>
              ))}
            </div>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-[13px] text-white outline-none focus:border-[#00ffff]/50 placeholder:text-zinc-600"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your experience…"
            rows={4}
            className="w-full resize-none border border-zinc-700 bg-zinc-900 px-3 py-2 text-[13px] text-white outline-none focus:border-[#00ffff]/50 placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#00ffff] py-2.5 text-[12px] font-black uppercase tracking-wider text-black hover:bg-[#00ffff]/85 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      </div>
    </section>
  );
}
