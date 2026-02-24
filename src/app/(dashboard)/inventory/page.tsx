import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Warehouse } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KardexTable } from '@/components/inventory/kardex-table'
import { KardexTableSkeleton } from '@/components/inventory/kardex-table-skeleton'
import { getStockMovements } from '@/actions/inventory'
import type { StockMovementType } from '@/types'

interface PageProps {
  searchParams: Promise<{
    search?: string
    type?: string
    page?: string
  }>
}

async function MovementsSection({ searchParams }: { searchParams: Awaited<PageProps['searchParams']> }) {
  const currentPage = searchParams.page ? Number(searchParams.page) : 1
  const currentSearch = searchParams.search || ''
  const currentType = searchParams.type || ''

  const { movements, total, pages } = await getStockMovements({
    search: currentSearch || undefined,
    type: currentType as StockMovementType | undefined,
    page: currentPage,
    pageSize: 25,
  })

  return (
    <KardexTable
      movements={movements}
      total={total}
      pages={pages}
      currentPage={currentPage}
      currentSearch={currentSearch}
      currentType={currentType}
    />
  )
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 shrink-0">
            <Warehouse className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventario / Kardex</h1>
            <p className="text-sm text-muted-foreground">
              Historial de movimientos de stock
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/inventory/new-entry">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ingreso
          </Link>
        </Button>
      </div>

      <Suspense fallback={<KardexTableSkeleton />}>
        <MovementsSection searchParams={params} />
      </Suspense>
    </div>
  )
}
