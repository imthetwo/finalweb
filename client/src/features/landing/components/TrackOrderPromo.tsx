import Link from "next/link";

export default function TrackOrderPromo() {
  return (
    <section className="border-y border-white/5 bg-base py-16 md:py-20">
      <div className="mx-auto max-w-[700px] px-4 text-center md:px-8">
        <h2 className="text-3xl font-black uppercase leading-tight tracking-tight text-fg md:text-4xl">
          Track Your Order
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-muted">
          Enter your order ID and phone number to check status instantly.
        </p>

        <Link
          href="/track-order"
          className="group mt-10 inline-flex items-center gap-3 bg-brand px-8 py-4 text-sm font-black uppercase tracking-[0.25em] text-black transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-btn"
        >
          Track My Order
        </Link>
      </div>
    </section>
  );
}
