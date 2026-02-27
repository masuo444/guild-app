export default function ProfileLoading() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-28 bg-white/10 rounded mb-2" />
        <div className="h-4 w-48 bg-white/10 rounded" />
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-white/10 rounded-full" />
        <div>
          <div className="h-5 w-32 bg-white/5 rounded mb-2" />
          <div className="h-3 w-24 bg-white/5 rounded" />
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i}>
            <div className="h-3 w-20 bg-white/5 rounded mb-2" />
            <div className="h-10 w-full bg-white/10 rounded-lg border border-zinc-500/30" />
          </div>
        ))}
      </div>
    </div>
  )
}
