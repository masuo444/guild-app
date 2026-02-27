export default function OffersLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-44 bg-white/10 rounded mb-2" />
        <div className="h-4 w-56 bg-white/10 rounded" />
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-10 w-24 bg-white/10 rounded-lg" />
        <div className="h-10 w-24 bg-white/10 rounded-lg" />
        <div className="h-10 w-24 bg-white/10 rounded-lg" />
      </div>

      {/* Cards */}
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-xl border border-zinc-500/30 p-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-white/5 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="h-5 w-40 bg-white/5 rounded mb-2" />
                <div className="h-3 w-full bg-white/5 rounded mb-1" />
                <div className="h-3 w-2/3 bg-white/5 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
