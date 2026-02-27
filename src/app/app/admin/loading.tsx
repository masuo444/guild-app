export default function AdminLoading() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-pulse">
      <div className="h-8 w-36 bg-white/10 rounded mb-6" />
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-xl p-4 border border-zinc-500/30">
            <div className="h-3 w-20 bg-white/5 rounded mb-2" />
            <div className="h-8 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white/10 rounded-xl border border-zinc-500/30 p-4">
        <div className="h-5 w-32 bg-white/5 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
