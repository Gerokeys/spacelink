import { Suspense } from "react"
import { SearchPageClient } from "./SearchPageClient"

export const metadata = {
  title: "Search Properties",
  description: "Search residential, office, and commercial spaces across Kenya.",
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchPageClient />
    </Suspense>
  )
}

function SearchSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-pulse">
      <div className="border-b border-slate-200 px-4 py-3 h-20 bg-slate-50 shrink-0" />
      <div className="border-b border-slate-200 px-4 py-2.5 h-12 bg-white shrink-0" />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:block w-72 border-r border-slate-200 bg-slate-50 shrink-0" />
        <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-slate-100">
              <div className="h-52 bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-5 bg-slate-200 rounded w-28" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
