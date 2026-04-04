export default function ShopLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-28 bg-white/10 rounded mb-2" />
        <div className="h-4 w-48 bg-white/10 rounded" />
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-xl border border-zinc-500/30 p-3">
            <div className="h-32 bg-white/5 rounded-lg mb-3" />
            <div className="h-4 w-24 bg-white/5 rounded mb-2" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
