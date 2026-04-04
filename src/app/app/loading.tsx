export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-36 bg-white/10 rounded" />
        <div className="h-8 w-12 bg-white/10 rounded-lg" />
      </div>

      {/* Membership Card */}
      <div className="mb-8">
        <div className="h-48 bg-white/10 rounded-2xl border border-zinc-500/30" />
      </div>

      {/* Guild Services */}
      <div className="mb-8">
        <div className="h-4 w-28 bg-white/10 rounded mb-3" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-white/10 rounded-xl border border-zinc-500/30" />
          <div className="h-24 bg-white/10 rounded-xl border border-zinc-500/30" />
        </div>
      </div>

      {/* Activity */}
      <div className="bg-white/10 rounded-xl border border-zinc-500/30 p-4">
        <div className="h-5 w-32 bg-white/5 rounded mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between py-2 border-b border-zinc-500/30 last:border-0">
            <div className="h-4 w-28 bg-white/5 rounded" />
            <div className="h-4 w-12 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
