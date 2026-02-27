export default function MapLoading() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-36 bg-white/10 rounded mb-2" />
        <div className="h-4 w-64 bg-white/10 rounded" />
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="h-10 flex-1 bg-white/10 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-white/10 rounded-lg" />
          <div className="h-10 w-28 bg-white/10 rounded-lg" />
        </div>
      </div>

      {/* Map placeholder */}
      <div className="w-full h-[400px] sm:h-[500px] bg-white/10 rounded-xl border border-zinc-500/30 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin" />
      </div>
    </div>
  )
}
