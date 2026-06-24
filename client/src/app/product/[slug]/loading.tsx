import type { CSSProperties } from "react";

function Bone({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={`overflow-hidden rounded bg-elevated ${className}`} style={style}>
      <div className="h-full w-full animate-shimmer bg-size-[200%_100%]" style={{ backgroundImage: "var(--gradient-shimmer-brand)" }} />
    </div>
  );
}

export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-base px-4 py-10 text-fg md:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">

        {/* Image skeleton */}
        <div className="relative aspect-square overflow-hidden border border-edge bg-surface">
          <div className="absolute inset-0 animate-shimmer bg-size-[200%_100%]" style={{ backgroundImage: "var(--gradient-shimmer-brand)" }} />
        </div>

        {/* Info skeleton */}
        <div className="space-y-4 pt-2">
          <Bone className="h-3 w-20" />
          <div className="space-y-2">
            <Bone className="h-8 w-4/5" />
            <Bone className="h-8 w-1/2" />
          </div>
          <Bone className="h-4 w-32" />
          <Bone className="mt-6 h-10 w-48" />
          <Bone className="h-4 w-28" />

          <div className="mt-6 space-y-2 border-y border-edge py-4">
            {[100, 90, 75].map((w, i) => (
              <Bone key={i} className="h-3" style={{ width: `${w}%` }} />
            ))}
          </div>

          <div className="mt-6 flex items-stretch gap-3">
            <Bone className="h-12 flex-1" />
            <div className="h-12 w-12 overflow-hidden border border-edge bg-surface">
              <div className="h-full w-full animate-shimmer bg-size-[200%_100%]" style={{ backgroundImage: "var(--gradient-shimmer-brand)" }} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
