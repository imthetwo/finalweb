export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-base px-4 py-10 text-fg md:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">

        {/* Image skeleton */}
        <div className="relative aspect-square overflow-hidden border border-edge bg-surface">
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 bg-[length:200%_100%]" />
        </div>

        {/* Info skeleton */}
        <div className="space-y-4 pt-2">
          {/* Brand */}
          <div className="h-3 w-20 overflow-hidden rounded bg-elevated">
            <div className="h-full w-full animate-shimmer bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]" />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <div className="h-8 w-4/5 overflow-hidden rounded bg-elevated">
              <div className="h-full w-full animate-shimmer bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]" />
            </div>
            <div className="h-8 w-1/2 overflow-hidden rounded bg-elevated">
              <div className="h-full w-full animate-shimmer bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]" />
            </div>
          </div>

          {/* Category */}
          <div className="h-4 w-32 overflow-hidden rounded bg-elevated">
            <div className="h-full w-full animate-shimmer bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]" />
          </div>

          {/* Price */}
          <div className="mt-6 h-10 w-48 overflow-hidden rounded bg-elevated">
            <div className="h-full w-full animate-shimmer bg-gradient-to-r from-zinc-800 via-[#00ffff]/10 to-zinc-800 bg-[length:200%_100%]" />
          </div>

          {/* Stock */}
          <div className="h-4 w-28 overflow-hidden rounded bg-elevated">
            <div className="h-full w-full animate-shimmer bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]" />
          </div>

          {/* Description lines */}
          <div className="mt-6 space-y-2 border-y border-edge py-4">
            {[100, 90, 75].map((w, i) => (
              <div key={i} className="h-3 overflow-hidden rounded bg-elevated" style={{ width: `${w}%` }}>
                <div className="h-full w-full animate-shimmer bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]" />
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex items-stretch gap-3">
            <div className="h-12 flex-1 overflow-hidden bg-elevated">
              <div className="h-full w-full animate-shimmer bg-gradient-to-r from-zinc-800 via-[#00ffff]/10 to-zinc-800 bg-[length:200%_100%]" />
            </div>
            <div className="h-12 w-12 overflow-hidden border border-edge bg-surface">
              <div className="h-full w-full animate-shimmer bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 bg-[length:200%_100%]" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
