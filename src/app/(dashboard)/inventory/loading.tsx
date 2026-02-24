import { KardexTableSkeleton } from '@/components/inventory/kardex-table-skeleton'

export default function InventoryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-white/10 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-white/10 rounded-lg animate-pulse" />
      </div>
      <KardexTableSkeleton />
    </div>
  )
}
