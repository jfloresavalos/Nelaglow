import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { OrderWizard } from '@/components/orders/order-wizard'

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Volver a pedidos">
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Pedido</h1>
          <p className="text-muted-foreground">
            Crea un nuevo pedido paso a paso
          </p>
        </div>
      </div>

      <OrderWizard />
    </div>
  )
}
