function Bone({ w = "100%", h = "1rem" }: { w?: string; h?: string }) {
  return (
    <div className="overflow-hidden rounded bg-zinc-800" style={{ width: w, height: h }}>
      <div className="h-full w-full animate-shimmer bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]" />
    </div>
  );
}

export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-base px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-screen-xl">
        {/* Title */}
        <div className="mb-6 flex items-center justify-between">
          <Bone w="160px" h="28px" />
          <Bone w="80px" h="16px" />
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden w-64 shrink-0 space-y-2.5 lg:block">
            <Bone w="90px" h="12px" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Bone key={i} w={`${50 + (i % 4) * 12}%`} h="13px" />
              ))}
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="border border-edge bg-[#111]">
                  <div className="aspect-square overflow-hidden bg-zinc-800">
                    <div className="h-full w-full animate-shimmer bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]" />
                  </div>
                  <div className="space-y-2 p-3">
                    <Bone w="60%" h="11px" />
                    <Bone w="100%" h="14px" />
                    <Bone w="75%" h="14px" />
                    <Bone w="40%" h="18px" />
                    <Bone w="100%" h="36px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
