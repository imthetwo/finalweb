export function AdminLoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-base">
      {/* Sidebar skeleton */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-edge bg-surface">
        <div className="border-b border-edge px-5 py-5">
          <div className="h-2 w-16 animate-shimmer rounded bg-brand/20 bg-[length:200%_100%]" style={{ backgroundImage: 'var(--gradient-shimmer-brand)' }} />
          <div className="mt-2 h-4 w-28 animate-pulse rounded bg-elevated" />
        </div>
        <div className="flex-1 space-y-1.5 p-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-elevated/60" style={{ opacity: 1 - i * 0.08 }} />
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="h-7 w-48 animate-pulse rounded bg-elevated" />
          <div className="h-9 w-32 animate-pulse rounded bg-elevated" />
        </div>

        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-edge bg-elevated p-5">
              <div className="h-3 w-20 animate-pulse rounded bg-elevated" />
              <div className="mt-3 h-8 w-32 animate-pulse rounded bg-elevated" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="border border-edge bg-elevated">
          <div className="border-b border-edge px-4 py-3">
            <div className="h-3 w-full animate-pulse rounded bg-elevated" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-edge/50 px-4 py-3">
              <div className="h-10 w-10 shrink-0 animate-pulse bg-elevated" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 animate-pulse rounded bg-elevated" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-elevated" />
              </div>
              <div className="h-3 w-20 animate-pulse rounded bg-elevated" />
              <div className="h-3 w-12 animate-pulse rounded bg-elevated" />
              <div className="h-5 w-10 animate-pulse rounded bg-elevated" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
