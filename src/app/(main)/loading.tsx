export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-8 bg-slate-200 rounded w-48 mb-3" />
      <div className="h-4 bg-slate-100 rounded w-64 mb-10" />
      {/* Listing cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-slate-100">
            <div className="h-52 bg-slate-200" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-slate-200 rounded w-28" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-px bg-slate-100 my-2" />
              <div className="flex gap-3">
                <div className="h-3 bg-slate-100 rounded w-12" />
                <div className="h-3 bg-slate-100 rounded w-12" />
                <div className="h-3 bg-slate-100 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
