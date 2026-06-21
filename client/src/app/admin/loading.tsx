export default function AdminLoading() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar skeleton */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-800 bg-[#0d0d0d]">
        <div className="border-b border-zinc-800 px-5 py-5">
          <div className="h-2 w-16 animate-shimmer rounded bg-[#00ffff]/20 bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, #00ffff33, transparent)' }} />
          <div className="mt-2 h-4 w-28 animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="flex-1 space-y-1.5 p-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-zinc-800/60" style={{ opacity: 1 - i * 0.08 }} />
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="h-7 w-48 animate-pulse rounded bg-zinc-800" />
          <div className="h-9 w-32 animate-pulse rounded bg-zinc-800" />
        </div>

        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-zinc-800 bg-[#111] p-5">
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
              <div className="mt-3 h-8 w-32 animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="border border-zinc-800 bg-[#111]">
          <div className="border-b border-zinc-800 px-4 py-3">
            <div className="h-3 w-full animate-pulse rounded bg-zinc-800" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-zinc-800/50 px-4 py-3">
              <div className="h-10 w-10 shrink-0 animate-pulse bg-zinc-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-800" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-zinc-800" />
              </div>
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-12 animate-pulse rounded bg-zinc-800" />
              <div className="h-5 w-10 animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
