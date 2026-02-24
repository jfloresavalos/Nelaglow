import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getOrder } from '@/actions/orders'
import { OrderDetail } from '@/components/orders/order-detail'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Volver a pedidos">
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Cliente: {order.client.name}
          </p>
        </div>
      </div>

      <OrderDetail order={order} />
    </div>
  )
}
