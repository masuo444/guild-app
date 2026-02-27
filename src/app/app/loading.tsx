export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-40 bg-white/10 rounded" />
        <div className="h-8 w-12 bg-white/10 rounded-lg" />
      </div>

      {/* Membership card skeleton */}
      <div className="mb-8 h-56 bg-white/10 rounded-2xl" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-xl p-4 border border-zinc-500/30">
            <div className="h-3 w-16 bg-white/5 rounded mb-2" />
            <div className="h-6 w-20 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* Activity log skeleton */}
      <div className="bg-white/10 rounded-xl border border-zinc-500/30 p-4">
        <div className="h-5 w-32 bg-white/5 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-zinc-500/30 last:border-0">
              <div className="h-4 w-28 bg-white/5 rounded" />
              <div className="h-4 w-12 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
