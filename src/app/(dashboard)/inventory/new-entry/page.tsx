import Link from 'next/link'
import { ArrowLeft, PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BulkStockEntryForm } from '@/components/inventory/bulk-stock-entry-form'

export default function NewStockEntryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-9 w-9" aria-label="Volver al inventario">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <PackagePlus className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Nuevo Ingreso de Stock</h1>
            <p className="text-sm text-muted-foreground">
              Registra la entrada de uno o varios productos
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <BulkStockEntryForm />
      </div>
    </div>
  )
}
