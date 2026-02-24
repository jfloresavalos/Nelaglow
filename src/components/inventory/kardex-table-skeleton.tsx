import { Skeleton } from '@/components/ui/skeleton'

export function KardexTableSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex gap-3 mb-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2 border-b border-white/10">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-12 text-right" />
          <Skeleton className="h-4 w-20 text-right" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}
