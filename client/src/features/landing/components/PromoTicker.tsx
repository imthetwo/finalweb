const ITEMS = [
  "Free Shipping on orders over 2,000,000 VND",
  "RTX 5080 — In Stock Now",
  "Intel Core Ultra 200 Series Available",
  "2-Year Warranty on All Components",
  "PC Builder — Build Your Dream PC",
  "RGB Sync on All Supported Gear",
  "Same-Day Dispatch Before 2PM",
  "Genuine Products — Official Distributor",
];

export default function PromoTicker() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track { animation: ticker-scroll 32s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>

      <div className="overflow-hidden border-y border-brand/15 bg-brand py-3 select-none">
        <div className="ticker-track flex whitespace-nowrap" style={{ width: "max-content" }}>
          {doubled.map((item, i) => (
            <span
              key={i}
              className="mx-8 inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-black"
            >
              {item}
              <span className="h-1 w-1 rounded-full bg-base/30" />
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
