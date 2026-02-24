import Link from 'next/link'
import { ArrowLeft, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HistoricalOrderForm } from '@/components/orders/historical-order-form'

export default function HistoricalOrderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Volver a pedidos">
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ingresar pedido histórico</h1>
            <p className="text-sm text-muted-foreground">
              Pedidos ya despachados por Shalom que aún no están en el sistema
            </p>
          </div>
        </div>
      </div>

      <HistoricalOrderForm />
    </div>
  )
}
